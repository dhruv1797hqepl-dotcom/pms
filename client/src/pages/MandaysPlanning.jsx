import React, { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, CalendarDays, Loader2, Download } from 'lucide-react';
import * as XLSX from 'xlsx';
import Sidebar from '../components/Sidebar';
import api from '../api';

const unwrapList = (payload) => {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (Array.isArray(payload?.results)) {
    return payload.results;
  }

  return [];
};

const getEmployeeDisplayName = (employee) => {
  const role = normalizeRole(employee?.role);
  if (role === 'HQEPL') {
    const fullName = `${employee.first_name || ''} ${employee.last_name || ''}`.trim();
    return fullName || employee.full_name || employee.username || employee.shortform || employee.employee_name || employee.email || 'HQEPL';
  }

  const fullName = `${employee.first_name || ''} ${employee.last_name || ''}`.trim();
  if (fullName) {
    return fullName;
  }

  if (employee.full_name) {
    return employee.full_name;
  }

  if (employee?.is_mls) {
    return employee.shortform || employee.username || 'MLS';
  }

  if (employee.employee_name) {
    return employee.employee_name;
  }

  if (employee.shortform) {
    return employee.shortform;
  }

  if (employee.username) {
    return employee.username;
  }

  if (employee.email) {
    return employee.email;
  }

  return `Employee ${employee.employee_id || employee.id}`;
};

const parseHours = (value) => {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : 0;
};

const parseDays = (value) => {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : 0;
};

const normalizeIdentityToken = (value) => String(value || '').trim().toLowerCase();

const formatDaysValue = (value) => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return '0';

  const rounded = Math.round((numeric + Number.EPSILON) * 100) / 100;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(2);
};

const normalizeRole = (value) => String(value || '').toUpperCase();

const getResolvedUserId = (person) => {
  const candidate = person?.id ?? person?.user_id ?? person?.user?.id ?? null;
  return candidate !== null && candidate !== undefined ? String(candidate) : '';
};

const getResolvedEmployeeProfileId = (person) => {
  const candidate =
    person?.employee_profile_id
    ?? person?.employee_profile?.id
    ?? person?.employee?.id
    ?? null;
  return candidate !== null && candidate !== undefined ? String(candidate) : '';
};

const isMlsIdentity = (person) => {
  if (!person) return false;

  if (person.is_mls) return true;

  // Check role field directly for MLS role
  if (String(person.role || '').toUpperCase() === 'MLS') return true;

  // Keep MLS detection strict to avoid misclassifying HQEPL/other roles.
  return String(person.shortform || '').toUpperCase() === 'MLS';
};

const getRowPriority = (person) => {
  if (isMlsIdentity(person)) return 0;

  const role = normalizeRole(person?.role);
  if (role === 'HQEPL') return 1;
  if (role === 'SGM') return 2;
  if (role === 'EMPLOYEE') return 3;

  return 4;
};

const MandaysPlanning = () => {
  const [loading, setLoading] = useState(true);
  const [clients, setClients] = useState([]);
  const [hrRows, setHrRows] = useState([]);
  const [hoursMatrix, setHoursMatrix] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const [isCurrentUserLoading, setIsCurrentUserLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  const selectedMonth = currentDate.getMonth() + 1;
  const selectedYear = currentDate.getFullYear();

  const monthLabel = useMemo(
    () => currentDate.toLocaleString('default', { month: 'long', year: 'numeric' }),
    [currentDate]
  );

  const srNoColumnWidth = 80;
  const nameColumnWidth = 260;

  const totalColumnCount = useMemo(() => 5 + Math.max(clients.length, 1) * 2, [clients.length]);

  const minTableWidth = useMemo(
    () => `${srNoColumnWidth + nameColumnWidth + Math.max(clients.length, 1) * 220 + 260}px`,
    [clients.length]
  );

  useEffect(() => {
    const fetchCurrentProfile = async () => {
      const role = (localStorage.getItem('role') || '').toUpperCase();
      if (!['SGM', 'EMPLOYEE', 'MLS'].includes(role)) return;

      let profileData = null;
      let lastError = null;

      try {
        for (const endpoint of ['/me/', 'me/', 'accounts/me/', 'accounts/profile/']) {
          try {
            const res = await api.get(endpoint);
            profileData = res.data;
            break;
          } catch (err) {
            lastError = err;
            // Keep fallback behavior for legacy deployments where one of these routes may not exist.
            if (err?.response?.status !== 404) {
              break;
            }
          }
        }

        if (profileData) {
          setCurrentUser(profileData);
        } else if (lastError) {
          console.warn('Failed to fetch user profile:', lastError);
        }
      } catch (unexpectedError) {
        console.warn('Failed to fetch user profile:', unexpectedError);
      } finally {
        setIsCurrentUserLoading(false);
      }
    };
    fetchCurrentProfile();
  }, []);

  const currentUserDisplayName = useMemo(() => {
    if (!currentUser) return '';
    const fullName = `${currentUser.first_name || ''} ${currentUser.last_name || ''}`.trim();
    return (
      fullName ||
      currentUser.full_name ||
      currentUser.shortform ||
      currentUser.username ||
      currentUser.employee_name ||
      currentUser.email ||
      ''
    );
  }, [currentUser]);

  useEffect(() => {
    const fetchPlanningData = async () => {
      try {
        setIsLoading(true);
        setErrorMessage('');
        setClients([]);
        setHrRows([]);
        setHoursMatrix({});

        const role = (localStorage.getItem('role') || '').toUpperCase();
        const isSgm = role === 'SGM';
        const isEmployee = role === 'EMPLOYEE';
        const isPrivilegedViewer = role === 'HQEPL' || role === 'MLS' || role === 'ADMIN';

        // Skip if we're still waiting for currentUser to load (for SGM/EMPLOYEE roles)
        if ((isSgm || isEmployee) && isCurrentUserLoading) {
          return;
        }

        let clientsEndpoint = 'clients/list/';
        if (isEmployee) {
          clientsEndpoint = 'employees/clients/';
        }

        const clientsRequestConfig =
          isSgm && clientsEndpoint === 'clients/list/'
            ? { params: { view: 'mandays' } }
            : undefined;

        const clientsResponse = await api.get(clientsEndpoint, clientsRequestConfig);
        let normalizedClients = unwrapList(clientsResponse.data).map((client, index) => ({
          ...client,
          display_name: client.company_name || client.name || `Client ${index + 1}`,
        }));

        // For SGM view, filter to only clients where the SGM is assigned
        if (isSgm && currentUser) {
          const sgmUserId = getResolvedUserId(currentUser);
          normalizedClients = normalizedClients.filter((client) => {
            const assignedSgms = Array.isArray(client?.assigned_sgms_details)
              ? client.assigned_sgms_details
              : [];
            return assignedSgms.some((sgmUser) => String(sgmUser?.id) === String(sgmUserId));
          });
        }

        if (!normalizedClients.length) {
          setClients([]);
          setHrRows([]);
          setHoursMatrix({});
          return;
        }

        const employeeMap = new Map();
        const employeeProfileToUserId = new Map();
        const currentHoursMatrix = {};

        // For HQEPL/Admin, include all assigned SGMs so SGM section renders fully.
        if (!isSgm && !isEmployee) {
          normalizedClients.forEach((client) => {
            const assignedSgms = Array.isArray(client?.assigned_sgms_details)
              ? client.assigned_sgms_details
              : [];

            assignedSgms.forEach((sgmUser) => {
              if (!sgmUser?.id) return;

              const key = String(sgmUser.id);
              const existing = employeeMap.get(key) || {
                id: sgmUser.id,
                employee_id: sgmUser.id,
                user_id: sgmUser.id,
              };

              employeeMap.set(key, {
                ...existing,
                role: 'SGM',
                first_name: existing.first_name || sgmUser.first_name || '',
                last_name: existing.last_name || sgmUser.last_name || '',
                username: existing.username || sgmUser.username || '',
                email: existing.email || sgmUser.email || '',
                full_name: existing.full_name || sgmUser.full_name || '',
                shortform: existing.shortform || sgmUser.shortform || '',
              });

              if (sgmUser.employee_profile_id) {
                employeeProfileToUserId.set(String(sgmUser.employee_profile_id), key);
              }
            });
          });
        }

        normalizedClients.forEach((client) => {
          const assignedHqepls = Array.isArray(client?.assigned_hqepls_details)
            ? client.assigned_hqepls_details
            : [];

          assignedHqepls.forEach((hqeplUser) => {
            if (!hqeplUser?.id) return;

            const key = String(hqeplUser.id);
            const existing = employeeMap.get(key) || {
              id: hqeplUser.id,
              employee_id: hqeplUser.id,
              user_id: hqeplUser.id,
            };

            employeeMap.set(key, {
              ...existing,
              role: 'HQEPL',
              first_name: existing.first_name || hqeplUser.first_name || '',
              last_name: existing.last_name || hqeplUser.last_name || '',
              username: existing.username || hqeplUser.username || '',
              email: existing.email || hqeplUser.email || '',
              full_name: existing.full_name || hqeplUser.full_name || '',
              shortform: existing.shortform || hqeplUser.shortform || '',
            });

            if (hqeplUser.employee_profile_id) {
              employeeProfileToUserId.set(String(hqeplUser.employee_profile_id), key);
            }
          });
        });

        // Include MLS row(s) for HQEPL and SGM views.
        if (!isEmployee) {
          try {
            const hqeplUsersRes = await api.get('hqepl/');
            const hqeplUsers = unwrapList(hqeplUsersRes.data);

            hqeplUsers
              .filter((user) => isMlsIdentity(user))
              .forEach((mlsUser) => {
                if (!mlsUser?.id) return;

                const key = String(mlsUser.id);
                const existing = employeeMap.get(key) || {
                  id: mlsUser.id,
                  employee_id: mlsUser.id,
                  user_id: mlsUser.id,
                };

                employeeMap.set(key, {
                  ...existing,
                  is_mls: true,
                  role: normalizeRole(mlsUser.role) || 'HQEPL',
                  first_name: existing.first_name || mlsUser.first_name || '',
                  last_name: existing.last_name || mlsUser.last_name || '',
                  username: existing.username || mlsUser.username || '',
                  email: existing.email || mlsUser.email || '',
                  full_name: existing.full_name || mlsUser.full_name || '',
                  shortform: existing.shortform || mlsUser.shortform || '',
                });

                if (mlsUser.employee_profile_id) {
                  employeeProfileToUserId.set(String(mlsUser.employee_profile_id), key);
                }
              });
          } catch (hqeplError) {
            console.warn('Failed to fetch HQEPL list for MLS placement:', hqeplError);
          }
        }

        // 1. Always ensure current user (SGM/EMPLOYEE) is included.
        if ((isSgm || isEmployee) && currentUser) {
          const userId = getResolvedUserId(currentUser);
          const profileId = getResolvedEmployeeProfileId(currentUser);
          const normalizedCurrentRole = normalizeRole(currentUser.role || role || '');

          if (userId) {
            employeeMap.set(userId, {
              ...currentUser,
              id: currentUser.id ?? (Number(userId) || userId),
              employee_id: currentUser.employee_id ?? (Number(userId) || userId),
              user_id: Number(userId) || userId,
              role: normalizedCurrentRole,
              full_name: currentUserDisplayName || getEmployeeDisplayName(currentUser),
            });
          }

          if (profileId && userId) {
            employeeProfileToUserId.set(profileId, userId);
          }
        }

        if (isSgm) {
          // For SGM, fetch all their authorized employees at once
          try {
            const sgmEmployeesRes = await api.get('sgm/employees/');
            const sgmEmployees = unwrapList(sgmEmployeesRes.data);
            sgmEmployees.forEach((emp) => {
              const userId = emp.id;
              // Avoid overwriting SGM if they were already added (or just merge)
              employeeMap.set(String(userId), {
                ...emp,
                id: userId,
                employee_id: userId,
                user_id: userId,
                role: normalizeRole(emp.role || 'EMPLOYEE'),
              });
              if (emp.employee_profile_id) {
                employeeProfileToUserId.set(String(emp.employee_profile_id), String(userId));
              }
            });
          } catch (err) {
            console.error('Failed to fetch SGM employees:', err);
          }
        } else if (!isEmployee) {
          // Original logic for HQEPL/Admin/Client roles
          const employeeResults = await Promise.allSettled(
            normalizedClients.map((client) => api.get(`clients/${client.id}/employees/`))
          );

          employeeResults.forEach((result) => {
            if (result.status !== 'fulfilled') return;

            const employees = unwrapList(result.value.data);
            employees.forEach((employee) => {
              const userId = employee.user_id || employee.id;
              if (!userId) return;

              const key = String(userId);
              const existing = employeeMap.get(key) || {
                id: userId,
                employee_id: userId,
                user_id: userId,
                first_name: '',
                last_name: '',
                username: '',
                email: '',
                employee_name: '',
              };

              employeeMap.set(key, {
                ...existing,
                user_id: existing.user_id || userId,
                role: normalizeRole(existing.role || employee.role || ''),
                first_name: existing.first_name || employee.first_name || '',
                last_name: existing.last_name || employee.last_name || '',
                username: existing.username || employee.username || '',
                email: existing.email || employee.email || '',
              });

              // Assuming employee objects from clients/id/employees might have profile IDs too
              if (employee.id) {
                // If this is the Employee model ID
                employeeProfileToUserId.set(String(employee.id), key);
              }
            });
          });
        }

        if (isPrivilegedViewer) {
          try {
            const allUsersResponse = await api.get('admin/users/');
            const scopedUsers = unwrapList(allUsersResponse.data).filter((user) => {
              const normalizedRole = normalizeRole(user.role || '');
              return ['SGM', 'EMPLOYEE', 'HQEPL', 'MLS'].includes(normalizedRole);
            });

            scopedUsers.forEach((user) => {
              const userId = user.id;
              const key = String(userId);
              const existing = employeeMap.get(key) || {
                id: userId,
                employee_id: userId,
                employee_name: '',
              };

              employeeMap.set(key, {
                ...existing,
                id: userId,
                employee_id: existing.employee_id || userId,
                user_id: userId,
                role: normalizeRole(user.role || ''),
                first_name: existing.first_name || user.first_name || '',
                last_name: existing.last_name || user.last_name || '',
                username: existing.username || user.username || '',
                email: existing.email || user.email || '',
              });

              if (user.employee_profile_id) {
                employeeProfileToUserId.set(String(user.employee_profile_id), key);
              }
            });
          } catch (allUsersError) {
            console.warn('Failed to fetch global staff list for HQEPL/Admin:', allUsersError);
          }
        }

        // Fetch man days for all clients
        const employeeScopedProfileId = getResolvedEmployeeProfileId(currentUser)
          || String(currentUser?.employee_id || '').trim();

        const currentManDayResults = await Promise.allSettled(
          normalizedClients.map((client) => {
            let query = `client_id=${client.id}&month=${selectedMonth}&year=${selectedYear}`;
            if (isEmployee && employeeScopedProfileId) {
              query += `&employee_id=${employeeScopedProfileId}`;
            }
            return api.get(`ddtme/man-day-entries/?${query}`);
          })
        );

        const aggregateManDayResults = (results, matrixTarget, periodMonth, periodYear) => {
          const processedEntryIds = new Set();
          results.forEach((result, index) => {
            if (result.status !== 'fulfilled') return;

            const clientId = normalizedClients[index]?.id;
            const entries = unwrapList(result.value.data).filter((entry) => (
              Number(entry?.month) === Number(periodMonth)
              && Number(entry?.year) === Number(periodYear)
            ));

            entries.forEach((entry) => {
              if (processedEntryIds.has(entry.id)) return;
              processedEntryIds.add(entry.id);

              const profileId = entry.employee;
              let userId = profileId ? employeeProfileToUserId.get(String(profileId)) : null;
              const personKey = String(entry.person_key || '').toLowerCase().trim();
              const isMlsEntry = personKey === 'mls';

              if (!userId && entry.employee_user_id) {
                userId = String(entry.employee_user_id);
              }

              if (!userId && personKey.startsWith('u-')) {
                userId = personKey.slice(2);
              }

              if (!userId && personKey.startsWith('e-')) {
                const employeeProfileId = personKey.slice(2);
                userId = employeeProfileToUserId.get(employeeProfileId) || null;
              }

              if (!userId && isMlsEntry) {
                const mlsEmployee = Array.from(employeeMap.values()).find((emp) => isMlsIdentity(emp));
                if (mlsEmployee) {
                  userId = String(mlsEmployee.id || mlsEmployee.user_id || mlsEmployee.employee_id);
                }
              }

              if (!userId) {
                const entryName = String(entry.employee_name || '').trim().toLowerCase();
                if (entryName) {
                  for (const [mappedUserId, employee] of employeeMap.entries()) {
                    const candidates = [
                      getEmployeeDisplayName(employee),
                      employee?.employee_name,
                      employee?.full_name,
                      employee?.username,
                      `${employee?.first_name || ''} ${employee?.last_name || ''}`.trim(),
                    ]
                      .map((item) => String(item || '').trim().toLowerCase())
                      .filter(Boolean);

                    if (candidates.includes(entryName)) {
                      userId = mappedUserId;
                      break;
                    }
                  }
                }
              }

              const currentUserId = getResolvedUserId(currentUser)
                || String(currentUser?.employee_id || '').trim();
              const currentUserProfileId = employeeScopedProfileId;

              if (!userId && isEmployee && currentUserId && currentUserProfileId) {
                if (String(profileId) === currentUserProfileId) {
                  userId = currentUserId;
                }
              }

              if (!userId && !isEmployee) {
                const fallbackName = String(entry.employee_name || '').trim();
                const syntheticKey = fallbackName ? `name:${fallbackName.toLowerCase()}` : null;
                userId = syntheticKey || (profileId ? `e-${profileId}` : null);
              }

              if (!userId) return;

              if (isEmployee && currentUserId && String(userId) !== currentUserId) {
                return;
              }

              let existingEmployee = employeeMap.get(String(userId));
              if (!existingEmployee && isMlsEntry) {
                const fallbackLabel = String(entry.employee_name || '').trim() || 'MLS';
                existingEmployee = {
                  id: Number(userId) || userId,
                  user_id: Number(userId) || userId,
                  employee_id: Number(userId) || userId,
                  role: 'HQEPL',
                  username: fallbackLabel,
                  full_name: fallbackLabel,
                  is_mls: true,
                };
                employeeMap.set(String(userId), existingEmployee);
              }

              if (!existingEmployee) {
                const fallbackLabel = String(entry.employee_name || '').trim() || currentUserDisplayName || 'Employee';
                existingEmployee = {
                  id: Number(userId) || userId,
                  user_id: Number(userId) || userId,
                  employee_id: profileId || Number(userId) || userId,
                  role: isMlsEntry ? 'HQEPL' : 'EMPLOYEE',
                  username: currentUser?.username || fallbackLabel,
                  full_name: currentUserDisplayName || fallbackLabel,
                  employee_name: fallbackLabel,
                  ...(isMlsEntry ? { is_mls: true } : {}),
                };
                employeeMap.set(String(userId), existingEmployee);
              }

              if (isMlsEntry) {
                employeeMap.set(String(userId), {
                  ...existingEmployee,
                  is_mls: true,
                });
                existingEmployee = employeeMap.get(String(userId));
              }

              const normalizedEmployeeRole = normalizeRole(existingEmployee.role || '');
              if (normalizedEmployeeRole === 'ADMIN') {
                return;
              }

              const matrixKey = `${userId}_${clientId}`;
              const currentValues = matrixTarget[matrixKey] || { on: 0, off: 0, onDays: 0, offDays: 0 };
              const onsiteDaysRaw = entry?.onsite_days ?? entry?.on_days ?? entry?.plan_days ?? entry?.onsite_day ?? null;
              const offsiteDaysRaw = entry?.offsite_days ?? entry?.off_days ?? entry?.off_plan_days ?? entry?.offsite_day ?? null;
              const hasOnsiteDays = onsiteDaysRaw !== undefined && onsiteDaysRaw !== null && onsiteDaysRaw !== '';
              const hasOffsiteDays = offsiteDaysRaw !== undefined && offsiteDaysRaw !== null && offsiteDaysRaw !== '';
              const entryOnsiteDays = hasOnsiteDays ? parseDays(onsiteDaysRaw) : parseHours(entry.plan_hours) / 6;
              const entryOffsiteDays = hasOffsiteDays ? parseDays(offsiteDaysRaw) : parseHours(entry.off_hours) / 7.5;
              matrixTarget[matrixKey] = {
                on: currentValues.on + parseHours(entry.plan_hours),
                off: currentValues.off + parseHours(entry.off_hours),
                onDays: currentValues.onDays + entryOnsiteDays,
                offDays: currentValues.offDays + entryOffsiteDays,
              };
            });
          });
        };

        aggregateManDayResults(currentManDayResults, currentHoursMatrix, selectedMonth, selectedYear);

        // Use current month's values directly (no subtraction/merging with previous month)
        const nextHoursMatrix = { ...currentHoursMatrix };

        const baseEmployees = Array.from(employeeMap.values()).filter(
          (employee) => normalizeRole(employee.role || '') !== 'ADMIN'
        );

        const byDisplayName = (a, b) =>
          getEmployeeDisplayName(a).localeCompare(getEmployeeDisplayName(b));

        const dedupeById = (list) => {
          const seen = new Set();
          return list.filter((item) => {
            const key = String(item.id || item.user_id || item.employee_id || '');
            if (!key || seen.has(key)) return false;
            seen.add(key);
            return true;
          });
        };

        let mergedEmployees = [];
        let finalClients = normalizedClients;

        if (isEmployee) {
          const selfId = getResolvedUserId(currentUser);
          const selfProfileId = getResolvedEmployeeProfileId(currentUser);
          const fallbackIdentity = String(currentUser?.employee_id || '').trim();
          const effectiveSelfId = selfId || fallbackIdentity;
          const selfRow = currentUser
            ? {
              ...currentUser,
              id: currentUser.id ?? (Number(effectiveSelfId) || effectiveSelfId || 'self'),
              user_id: Number(effectiveSelfId) || effectiveSelfId || 'self',
              employee_id: currentUser.employee_id ?? (Number(effectiveSelfId) || effectiveSelfId || 'self'),
              role: normalizeRole(currentUser.role || role || 'EMPLOYEE'),
              full_name: currentUserDisplayName || getEmployeeDisplayName(currentUser),
            }
            : null;

          mergedEmployees = baseEmployees.filter((employee) => {
            const employeeUserId = getResolvedUserId(employee);
            const employeeProfileId = getResolvedEmployeeProfileId(employee);

            if (effectiveSelfId && employeeUserId === effectiveSelfId) return true;
            if (selfProfileId && employeeProfileId === selfProfileId) return true;
            return false;
          });

          if (!mergedEmployees.length && selfRow) {
            mergedEmployees = [selfRow];
          }

          if (!currentUser) {
            mergedEmployees = [];
          }

          if (mergedEmployees.length > 1 && selfRow) {
            const selfKey = String(selfRow.user_id || selfRow.id || selfRow.employee_id || '');
            mergedEmployees = mergedEmployees.filter((employee) => {
              const candidate = String(employee.user_id || employee.id || employee.employee_id || '');
              return candidate === selfKey;
            });
          }

          if (mergedEmployees.length) {
            const selfRow = mergedEmployees[0];
            const selfKey = String(selfRow.user_id || selfRow.id || selfRow.employee_id || '');
            const workedClientIds = new Set(
              normalizedClients
                .filter((client) => {
                  const matrix = nextHoursMatrix[`${selfKey}_${client.id}`];
                  if (!matrix) return false;
                  return parseHours(matrix.on) > 0 || parseHours(matrix.off) > 0;
                })
                .map((client) => String(client.id))
            );

            if (workedClientIds.size > 0) {
              finalClients = normalizedClients.filter((client) => workedClientIds.has(String(client.id)));
            } else {
              finalClients = normalizedClients;
            }
          }
        } else if (isSgm) {
          const selfId = String(currentUser?.id || '');
          const mlsRows = baseEmployees.filter((emp) => isMlsIdentity(emp)).sort(byDisplayName);
          const hqeplRows = baseEmployees
            .filter((emp) => normalizeRole(emp.role || '') === 'HQEPL' && !isMlsIdentity(emp))
            .sort(byDisplayName);
          const selfRows = baseEmployees.filter((emp) => String(emp.id || emp.user_id) === selfId);
          const assignedEmployeeRows = baseEmployees
            .filter((emp) => normalizeRole(emp.role || '') === 'EMPLOYEE')
            .sort(byDisplayName);

          mergedEmployees = dedupeById([...mlsRows, ...hqeplRows, ...selfRows, ...assignedEmployeeRows]);
        } else {
          // HQEPL / ADMIN View
          const mlsRows = baseEmployees.filter((emp) => isMlsIdentity(emp)).sort(byDisplayName);
          const hqeplRows = baseEmployees
            .filter((emp) => {
              const r = normalizeRole(emp.role || '');
              return r === 'HQEPL' && !isMlsIdentity(emp);
            })
            .sort(byDisplayName);
          const sgmRows = baseEmployees
            .filter((emp) => normalizeRole(emp.role || '') === 'SGM')
            .sort(byDisplayName);
          const employeeRows = baseEmployees
            .filter((emp) => normalizeRole(emp.role || '') === 'EMPLOYEE')
            .sort(byDisplayName);

          mergedEmployees = dedupeById([...mlsRows, ...hqeplRows, ...sgmRows, ...employeeRows]);
        }

        setClients(finalClients);
        setHrRows(mergedEmployees);
        setHoursMatrix(nextHoursMatrix);
      } catch (error) {
        console.error('Failed to load mandays planning data:', error);
        setErrorMessage('Unable to load clients and HR planning data.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchPlanningData();
  }, [selectedMonth, selectedYear, currentUser, currentUserDisplayName, isCurrentUserLoading]);

  const getRowHours = (employee, clientId) => {
    if (!employee || clientId == null) return null;

    const clientKey = String(clientId);
    const aliasKeys = new Set();
    const displayName = getEmployeeDisplayName(employee);

    [
      employee?.id,
      employee?.user_id,
      employee?.employee_id,
      displayName ? `name:${normalizeIdentityToken(displayName)}` : null,
      employee?.employee_name ? `name:${normalizeIdentityToken(employee.employee_name)}` : null,
      employee?.full_name ? `name:${normalizeIdentityToken(employee.full_name)}` : null,
      employee?.username ? `name:${normalizeIdentityToken(employee.username)}` : null,
    ].forEach((candidate) => {
      if (candidate === null || candidate === undefined || candidate === '') return;
      aliasKeys.add(String(candidate));
    });

    for (const alias of aliasKeys) {
      const matrix = hoursMatrix[`${alias}_${clientKey}`];
      if (matrix) return matrix;
    }

    return null;
  };

  const findEmployeeById = (employeeId) => {
    const key = String(employeeId || '');
    return hrRows.find((employee) => String(employee?.id) === key)
      || hrRows.find((employee) => String(employee?.user_id) === key)
      || hrRows.find((employee) => String(employee?.employee_id) === key)
      || null;
  };

  const getDaysDisplay = (employeeId, clientId, field) => {
    const employee = findEmployeeById(employeeId);
    const rowHours = getRowHours(employee, clientId);
    if (!rowHours) return '-';

    const days = field === 'on' ? parseDays(rowHours.onDays) : parseDays(rowHours.offDays);
    if (days === 0) return '-';
    return days % 1 === 0 ? String(days) : days.toFixed(2);
  };

  const getEmployeeTotalOnsiteDays = (employeeId) => {
    const employee = findEmployeeById(employeeId);
    if (!employee) return '0';

    const total = clients.reduce((sum, client) => {
      const rowHours = getRowHours(employee, client.id);
      if (!rowHours) return sum;
      return sum + parseDays(rowHours.onDays);
    }, 0);
    return total % 1 === 0 ? String(total) : total.toFixed(2);
  };

  const getEmployeeTotalOffsiteDays = (employeeId) => {
    const employee = findEmployeeById(employeeId);
    if (!employee) return '0';

    const total = clients.reduce((sum, client) => {
      const rowHours = getRowHours(employee, client.id);
      if (!rowHours) return sum;
      return sum + parseDays(rowHours.offDays);
    }, 0);
    return total % 1 === 0 ? String(total) : total.toFixed(2);
  };

  const getEmployeeTotalDays = (employeeId) => {
    const employee = findEmployeeById(employeeId);
    if (!employee) return '0';

    const total = clients.reduce((sum, client) => {
      const rowHours = getRowHours(employee, client.id);
      if (!rowHours) return sum;

      const onsiteDays = parseDays(rowHours.onDays);
      const offsiteDays = parseDays(rowHours.offDays);
      return sum + onsiteDays + offsiteDays;
    }, 0);

    return total % 1 === 0 ? String(total) : total.toFixed(2);
  };

  const allEmployeesTotals = useMemo(() => {
    const totals = hrRows.reduce(
      (accumulator, employee) => {
        clients.forEach((client) => {
          const rowHours = getRowHours(employee, client.id);
          if (!rowHours) return;

          accumulator.onsite += parseDays(rowHours.onDays);
          accumulator.offsite += parseDays(rowHours.offDays);
        });

        return accumulator;
      },
      { onsite: 0, offsite: 0 }
    );

    const totalDays = totals.onsite + totals.offsite;

    return {
      onsite: formatDaysValue(totals.onsite),
      offsite: formatDaysValue(totals.offsite),
      total: formatDaysValue(totalDays),
    };
  }, [clients, hrRows, hoursMatrix]);

  const clientWiseTotals = useMemo(() => {
    return clients.reduce((accumulator, client) => {
      const totals = hrRows.reduce(
        (employeeAccumulator, employee) => {
          const rowHours = getRowHours(employee, client.id);
          if (!rowHours) {
            return employeeAccumulator;
          }

          return {
            onsite: employeeAccumulator.onsite + parseDays(rowHours.onDays),
            offsite: employeeAccumulator.offsite + parseDays(rowHours.offDays),
          };
        },
        { onsite: 0, offsite: 0 }
      );

      accumulator[String(client.id)] = {
        onsite: formatDaysValue(totals.onsite),
        offsite: formatDaysValue(totals.offsite),
      };

      return accumulator;
    }, {});
  }, [clients, hrRows, hoursMatrix]);

  const handleDownloadExcel = () => {
    const workbook = XLSX.utils.book_new();
    
    // Header Row 1: Sr No, Name, [Clients...], Totals
    const headerRow1 = ['Sr No', 'Name'];
    clients.forEach(client => {
      headerRow1.push(client.display_name, ''); // Colspan 2 effect in data
    });
    headerRow1.push('Total Onsite Days', 'Total Offsite Days', 'Total Days');

    // Header Row 2: (Empty), (Empty), [OnSite, OffSite...], (Empty)
    const headerRow2 = ['', ''];
    clients.forEach(() => {
      headerRow2.push('OnSite Days', 'Offsite Days');
    });
    headerRow2.push('', '', '');

    const data = [headerRow1, headerRow2];

    // Employee Rows
    hrRows.forEach((row, index) => {
      const excelRow = [index + 1, getEmployeeDisplayName(row)];
      clients.forEach(client => {
        excelRow.push(
          getDaysDisplay(row.id, client.id, 'on'),
          getDaysDisplay(row.id, client.id, 'off')
        );
      });
      excelRow.push(
        getEmployeeTotalOnsiteDays(row.id),
        getEmployeeTotalOffsiteDays(row.id),
        getEmployeeTotalDays(row.id)
      );
      data.push(excelRow);
    });

    // Total (All Employees) Row
    const totalRow = ['-', 'Total (All Employees)'];
    clients.forEach(client => {
      totalRow.push(
        clientWiseTotals[String(client.id)]?.onsite || '0',
        clientWiseTotals[String(client.id)]?.offsite || '0'
      );
    });
    totalRow.push(allEmployeesTotals.onsite, allEmployeesTotals.offsite, allEmployeesTotals.total);
    data.push(totalRow);

    // Overall Days Row
    const overallRow = ['-', 'Overall Days'];
    clients.forEach(client => {
      const clientTotal = (parseFloat(clientWiseTotals[String(client.id)]?.onsite) || 0) + (parseFloat(clientWiseTotals[String(client.id)]?.offsite) || 0);
      const formattedTotal = (Math.round((clientTotal + Number.EPSILON) * 100) / 100).toFixed(2);
      overallRow.push(formattedTotal, ''); // Use colSpan conceptually
    });
    overallRow.push('-', '-', allEmployeesTotals.total);
    data.push(overallRow);

    const worksheet = XLSX.utils.aoa_to_sheet(data);

    // Apply merges for headers and overall row
    const merges = [
      { s: { r: 0, c: 0 }, e: { r: 1, c: 0 } }, // Sr No
      { s: { r: 0, c: 1 }, e: { r: 1, c: 1 } }, // Name
      { s: { r: 0, c: data[0].length - 3 }, e: { r: 1, c: data[0].length - 3 } }, // Total Onsite
      { s: { r: 0, c: data[0].length - 2 }, e: { r: 1, c: data[0].length - 2 } }, // Total Offsite
      { s: { r: 0, c: data[0].length - 1 }, e: { r: 1, c: data[0].length - 1 } }, // Total Days
    ];

    // Client merges in header
    clients.forEach((_, idx) => {
      const colStart = 2 + idx * 2;
      merges.push({ s: { r: 0, c: colStart }, e: { r: 0, c: colStart + 1 } });
    });

    // Overall Days merges
    const overallRowIdx = data.length - 1;
    clients.forEach((_, idx) => {
      const colStart = 2 + idx * 2;
      merges.push({ s: { r: overallRowIdx, c: colStart }, e: { r: overallRowIdx, c: colStart + 1 } });
    });

    worksheet['!merges'] = merges;

    XLSX.utils.book_append_sheet(workbook, worksheet, 'Mandays Planning');
    XLSX.writeFile(workbook, `Mandays_Planning_${monthLabel.replace(' ', '_')}.xlsx`);
  };

  return (
    <div className="h-screen w-screen bg-slate-50 font-sans text-slate-800 flex overflow-hidden">
      <Sidebar />

      <main className="flex-1 overflow-y-auto px-6 py-8">
        <section className="max-w-425 mx-auto border border-slate-200 bg-white rounded-2xl shadow-sm overflow-hidden p-6 md:p-8 space-y-6 min-h-180">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5 border border-slate-200 rounded-xl px-5 py-4 bg-white">
            <div className="flex items-center gap-4">
              <span className="h-12 w-12 rounded-xl bg-blue-600 text-white grid place-items-center shadow-md">
                <CalendarDays size={22} />
              </span>
              <div>
                <p className="text-xs font-black tracking-[0.2em] uppercase text-slate-500">Planning Period</p>
                <h1 className="text-3xl font-black text-slate-900 tracking-tight">
                  {currentUserDisplayName ? `${currentUserDisplayName} - Mandays Planning` : 'Mandays Planning'}
                </h1>
              </div>
            </div>

            <div className="inline-flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl p-1.5">
              <button
                type="button"
                onClick={() => setCurrentDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))}
                className="h-10 w-10 rounded-lg text-slate-700 hover:bg-white hover:shadow-sm transition-all"
                title="Previous Month"
              >
                <ChevronLeft size={18} className="mx-auto" />
              </button>

              <span className="px-4 text-sm font-bold text-slate-700 min-w-45 text-center">{monthLabel}</span>

              <button
                type="button"
                onClick={() => setCurrentDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))}
                className="h-10 w-10 rounded-lg text-slate-700 hover:bg-white hover:shadow-sm transition-all"
                title="Next Month"
              >
                <ChevronRight size={18} className="mx-auto" />
              </button>
            </div>

            <button
              onClick={handleDownloadExcel}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-md active:scale-95"
            >
              <Download size={18} />
              <span>Download Excel</span>
            </button>
          </div>

          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse" style={{ minWidth: minTableWidth }}>
                <thead>
                  <tr className="bg-slate-100 text-slate-800 text-xs">
                    <th rowSpan={2} className="sticky left-0 z-40 border border-slate-300 px-2 py-2 text-left font-black bg-slate-100" style={{ width: `${srNoColumnWidth}px`, minWidth: `${srNoColumnWidth}px` }}>
                      Sr No
                    </th>
                    <th
                      rowSpan={2}
                      className="sticky z-40 border border-slate-300 px-2 py-2 text-left font-black bg-slate-100"
                      style={{ left: `${srNoColumnWidth}px`, minWidth: `${nameColumnWidth}px` }}
                    >
                      Name
                    </th>
                    {(clients.length ? clients : [{ id: 'fallback', display_name: 'Client 1' }]).map((client) => (
                      <th key={`client-head-${client.id}`} colSpan={2} className="border border-slate-300 px-2 py-2 text-center font-black min-w-44">
                        {client.display_name}
                      </th>
                    ))}
                    <th rowSpan={2} className="border border-slate-300 px-2 py-2 text-center font-black min-w-24">
                      Total Onsite Days
                    </th>
                    <th rowSpan={2} className="border border-slate-300 px-2 py-2 text-center font-black min-w-24">
                      Total Offsite Days
                    </th>
                    <th rowSpan={2} className="border border-slate-300 px-2 py-2 text-center font-black min-w-24">
                      Total Days
                    </th>
                  </tr>
                  <tr className="bg-slate-50 text-slate-700 text-xs uppercase tracking-wider">
                    {(clients.length ? clients : [{ id: 'fallback' }]).map((client) => (
                      <React.Fragment key={`client-subhead-${client.id}`}>
                        <th className="border border-slate-300 px-2 py-1.5 text-center font-black">OnSite Days</th>
                        <th className="border border-slate-300 px-2 py-1.5 text-center font-black">Offsite Days</th>
                      </React.Fragment>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {isLoading ? (
                    <tr>
                      <td colSpan={totalColumnCount} className="border border-slate-200 px-4 py-16">
                        <div className="flex items-center justify-center gap-3 text-slate-500 font-semibold">
                          <Loader2 size={20} className="animate-spin" />
                          Loading clients and HR data...
                        </div>
                      </td>
                    </tr>
                  ) : hrRows.length > 0 ? (
                    <>
                      {hrRows.map((row, index) => (
                        <tr key={`row-${row.id}`} className="group bg-white hover:bg-slate-50 transition-colors text-xs">
                          <td className="sticky left-0 z-30 border border-slate-200 px-2 py-2 font-bold text-slate-600 bg-white group-hover:bg-slate-50" style={{ width: `${srNoColumnWidth}px`, minWidth: `${srNoColumnWidth}px` }}>
                            {index + 1}
                          </td>
                          <td
                            className="sticky z-30 border border-slate-200 px-2 py-2 font-semibold text-slate-800 bg-white group-hover:bg-slate-50"
                            style={{ left: `${srNoColumnWidth}px`, minWidth: `${nameColumnWidth}px` }}
                          >
                            {getEmployeeDisplayName(row)}
                          </td>
                          {(clients.length ? clients : [{ id: 'fallback' }]).map((client) => (
                            <React.Fragment key={`days-${row.id}-${client.id}`}>
                              <td className="border border-slate-200 px-2 py-2 text-center font-semibold text-slate-700">
                                {client.id === 'fallback' ? '-' : getDaysDisplay(row.id, client.id, 'on')}
                              </td>
                              <td className="border border-slate-200 px-2 py-2 text-center font-semibold text-slate-700">
                                {client.id === 'fallback' ? '-' : getDaysDisplay(row.id, client.id, 'off')}
                              </td>
                            </React.Fragment>
                          ))}
                          <td className="border border-slate-200 px-2 py-2 text-center font-bold text-slate-800">
                            {clients.length ? getEmployeeTotalOnsiteDays(row.id) : '-'}
                          </td>
                          <td className="border border-slate-200 px-2 py-2 text-center font-bold text-slate-800">
                            {clients.length ? getEmployeeTotalOffsiteDays(row.id) : '-'}
                          </td>
                          <td className="border border-slate-200 px-2 py-2 text-center font-bold text-slate-800">
                            {clients.length ? getEmployeeTotalDays(row.id) : '-'}
                          </td>
                        </tr>
                      ))}

                      <tr className="bg-slate-100 text-xs">
                        <td className="sticky left-0 z-30 border border-slate-300 px-2 py-2 font-black text-slate-700 bg-slate-100" style={{ width: `${srNoColumnWidth}px`, minWidth: `${srNoColumnWidth}px` }}>
                          -
                        </td>
                        <td
                          className="sticky z-30 border border-slate-300 px-2 py-2 font-black text-slate-800 bg-slate-100"
                          style={{ left: `${srNoColumnWidth}px`, minWidth: `${nameColumnWidth}px` }}
                        >
                          Total (All Employees)
                        </td>
                        {(clients.length ? clients : [{ id: 'fallback' }]).map((client) => (
                          <React.Fragment key={`grand-total-${client.id}`}>
                            <td className="border border-slate-300 px-2 py-2 text-center font-black text-slate-700">
                              {client.id === 'fallback' ? '-' : (clientWiseTotals[String(client.id)]?.onsite || '0')}
                            </td>
                            <td className="border border-slate-300 px-2 py-2 text-center font-black text-slate-700">
                              {client.id === 'fallback' ? '-' : (clientWiseTotals[String(client.id)]?.offsite || '0')}
                            </td>
                          </React.Fragment>
                        ))}
                        <td className="border border-slate-300 px-2 py-2 text-center font-black text-slate-900">
                          {allEmployeesTotals.onsite}
                        </td>
                        <td className="border border-slate-300 px-2 py-2 text-center font-black text-slate-900">
                          {allEmployeesTotals.offsite}
                        </td>
                        <td className="border border-slate-300 px-2 py-2 text-center font-black text-slate-900">
                          {allEmployeesTotals.total}
                        </td>
                      </tr>

                      <tr className="bg-blue-50 text-xs">
                        <td className="sticky left-0 z-30 border border-slate-300 px-2 py-2 font-black text-blue-700 bg-blue-50" style={{ width: `${srNoColumnWidth}px`, minWidth: `${srNoColumnWidth}px` }}>
                          -
                        </td>
                        <td
                          className="sticky z-30 border border-slate-300 px-2 py-2 font-black text-blue-800 bg-blue-50"
                          style={{ left: `${srNoColumnWidth}px`, minWidth: `${nameColumnWidth}px` }}
                        >
                          Overall Days
                        </td>
                        {(clients.length ? clients : [{ id: 'fallback' }]).map((client) => {
                          const clientTotal = client.id === 'fallback' 
                            ? null 
                            : (parseFloat(clientWiseTotals[String(client.id)]?.onsite) || 0) + (parseFloat(clientWiseTotals[String(client.id)]?.offsite) || 0);
                          const formattedTotal = clientTotal !== null 
                            ? (Math.round((clientTotal + Number.EPSILON) * 100) / 100).toFixed(2) 
                            : '-';
                          return (
                            <React.Fragment key={`overall-total-${client.id}`}>
                              <td colSpan={2} className="border border-slate-300 px-2 py-2 text-center font-black text-blue-900 bg-blue-100">
                                {formattedTotal}
                              </td>
                            </React.Fragment>
                          );
                        })}
                        <td className="border border-slate-300 px-2 py-2 text-center font-black text-blue-900">
                          -
                        </td>
                        <td className="border border-slate-300 px-2 py-2 text-center font-black text-blue-900">
                          -
                        </td>
                        <td className="border border-slate-300 px-2 py-2 text-center font-black text-blue-900 bg-blue-100">
                          {allEmployeesTotals.total}
                        </td>
                      </tr>
                    </>
                  ) : (
                    <tr>
                      <td colSpan={totalColumnCount} className="border border-slate-200 px-4 py-12 text-center text-slate-500 font-semibold">
                        No HR members available for the selected month and client scope.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {errorMessage ? (
            <p className="text-sm font-semibold text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3">{errorMessage}</p>
          ) : null}
        </section>
      </main>
    </div>
  );
};

export default MandaysPlanning;
