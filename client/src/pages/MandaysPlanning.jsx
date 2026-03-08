import React, { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, CalendarDays, Loader2 } from 'lucide-react';
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
  const fullName = `${employee.first_name || ''} ${employee.last_name || ''}`.trim();
  if (fullName) {
    return fullName;
  }

  if (employee.employee_name) {
    return employee.employee_name;
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

const MANDAYS_ENDPOINTS = {
  clientsList: '/clients/list/',
  clientEmployees: (clientId) => `/clients/${encodeURIComponent(clientId)}/employees/`,
  manDayEntries: '/ddtme/man-day-entries/',
  adminUsers: '/admin/users/',
};

const MandaysPlanning = () => {
  const [loading, setLoading] = useState(true);
  const [clients, setClients] = useState([]);
  const [hrRows, setHrRows] = useState([]);
  const [hoursMatrix, setHoursMatrix] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
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

  const srNoColumnWidth = 96;
  const nameColumnWidth = 260;

  const totalColumnCount = useMemo(() => 3 + Math.max(clients.length, 1) * 2, [clients.length]);

  const minTableWidth = useMemo(
    () => `${srNoColumnWidth + nameColumnWidth + Math.max(clients.length, 1) * 220 + 140}px`,
    [clients.length]
  );

  useEffect(() => {
    const fetchPlanningData = async () => {
      try {
        setIsLoading(true);
        setErrorMessage('');
        const role = (localStorage.getItem('role') || '').toUpperCase();

        // Keep this page aligned to the full client directory endpoint.
        const clientsResponse = await api.get(MANDAYS_ENDPOINTS.clientsList);
        const normalizedClients = unwrapList(clientsResponse.data).map((client, index) => ({
          ...client,
          display_name: client.company_name || client.name || `Client ${index + 1}`,
        }));

        setClients(normalizedClients);

        if (!normalizedClients.length) {
          setHrRows([]);
          setHoursMatrix({});
          return;
        }

        const employeeResults = await Promise.allSettled(
          normalizedClients.map((client) => api.get(MANDAYS_ENDPOINTS.clientEmployees(client.id)))
        );

        const manDayResults = await Promise.allSettled(
          normalizedClients.map((client) =>
            api.get(MANDAYS_ENDPOINTS.manDayEntries, {
              params: {
                client_id: client.id,
                month: selectedMonth,
                year: selectedYear,
              },
            })
          )
        );

        const employeeMap = new Map();
        const nextHoursMatrix = {};

        employeeResults.forEach((result, index) => {
          if (result.status !== 'fulfilled') {
            return;
          }

          const clientId = normalizedClients[index]?.id;
          const employees = unwrapList(result.value.data);

          employees.forEach((employee) => {
            const employeeId = employee.employee_id ?? employee.id;
            if (!employeeId) {
              return;
            }

            const key = String(employeeId);
            const existing = employeeMap.get(key) || {
              id: employeeId,
              employee_id: employeeId,
              user_id: null,
              first_name: '',
              last_name: '',
              username: '',
              email: '',
              employee_name: '',
            };

            employeeMap.set(key, {
              ...existing,
              user_id: existing.user_id || employee.user_id || null,
              first_name: existing.first_name || employee.first_name || '',
              last_name: existing.last_name || employee.last_name || '',
              username: existing.username || employee.username || '',
              email: existing.email || employee.email || '',
            });

            if (!nextHoursMatrix[`${employeeId}_${clientId}`]) {
              nextHoursMatrix[`${employeeId}_${clientId}`] = null;
            }
          });
        });

        manDayResults.forEach((result, index) => {
          if (result.status !== 'fulfilled') {
            return;
          }

          const clientId = normalizedClients[index]?.id;
          const entries = unwrapList(result.value.data);

          entries.forEach((entry) => {
            const employeeId = entry.employee;
            if (!employeeId) {
              return;
            }

            const employeeKey = String(employeeId);
            const existingEmployee = employeeMap.get(employeeKey);
            if (!existingEmployee) {
              employeeMap.set(employeeKey, {
                id: employeeId,
                employee_id: employeeId,
                user_id: null,
                first_name: '',
                last_name: '',
                username: '',
                email: '',
                employee_name: entry.employee_name || '',
              });
            } else if (
              !existingEmployee.first_name &&
              !existingEmployee.last_name &&
              !existingEmployee.username &&
              !existingEmployee.email &&
              entry.employee_name
            ) {
              employeeMap.set(employeeKey, {
                ...existingEmployee,
                employee_name: entry.employee_name,
              });
            }

            const matrixKey = `${employeeId}_${clientId}`;
            const currentValues = nextHoursMatrix[matrixKey] || { on: 0, off: 0 };
            nextHoursMatrix[matrixKey] = {
              on: currentValues.on + parseHours(entry.plan_hours),
              off: currentValues.off + parseHours(entry.off_hours),
            };
          });
        });

        if (role === 'HQEPL' || role === 'ADMIN') {
          try {
            const allUsersResponse = await api.get(MANDAYS_ENDPOINTS.adminUsers);
            const scopedUsers = unwrapList(allUsersResponse.data).filter((user) => {
              const normalizedRole = String(user.role || '').toUpperCase();
              return ['SGM', 'EMPLOYEE', 'HQEPL'].includes(normalizedRole);
            });

            const identityToKey = new Map();
            employeeMap.forEach((employee, key) => {
              const email = String(employee.email || '').toLowerCase();
              const username = String(employee.username || '').toLowerCase();

              if (email) {
                identityToKey.set(`email:${email}`, key);
              }
              if (username) {
                identityToKey.set(`username:${username}`, key);
              }
              if (employee.user_id) {
                identityToKey.set(`user:${employee.user_id}`, key);
              }
            });

            scopedUsers.forEach((user) => {
              const email = String(user.email || '').toLowerCase();
              const username = String(user.username || '').toLowerCase();
              const userId = user.id;

              const matchedKey =
                (email && identityToKey.get(`email:${email}`)) ||
                (username && identityToKey.get(`username:${username}`)) ||
                (userId && identityToKey.get(`user:${userId}`));

              if (matchedKey) {
                const existing = employeeMap.get(matchedKey);
                employeeMap.set(matchedKey, {
                  ...existing,
                  user_id: existing.user_id || userId || null,
                  first_name: existing.first_name || user.first_name || '',
                  last_name: existing.last_name || user.last_name || '',
                  username: existing.username || user.username || '',
                  email: existing.email || user.email || '',
                });
                return;
              }

              const syntheticKey = `user_${userId}`;
              employeeMap.set(syntheticKey, {
                id: syntheticKey,
                employee_id: null,
                user_id: userId,
                first_name: user.first_name || '',
                last_name: user.last_name || '',
                username: user.username || '',
                email: user.email || '',
                employee_name: '',
              });

              if (email) {
                identityToKey.set(`email:${email}`, syntheticKey);
              }
              if (username) {
                identityToKey.set(`username:${username}`, syntheticKey);
              }
              if (userId) {
                identityToKey.set(`user:${userId}`, syntheticKey);
              }
            });
          } catch (allUsersError) {
            console.warn('Failed to fetch global staff list for HQEPL/Admin:', allUsersError);
          }
        }

        const mergedEmployees = Array.from(employeeMap.values()).sort((a, b) =>
          getEmployeeDisplayName(a).localeCompare(getEmployeeDisplayName(b))
        );

        setHrRows(mergedEmployees);
        setHoursMatrix(nextHoursMatrix);
      } catch (error) {
        console.error('Failed to load mandays planning data:', error);
        setClients([]);
        setHrRows([]);
        setHoursMatrix({});
        setErrorMessage('Unable to load clients and HR planning data.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchPlanningData();
  }, [selectedMonth, selectedYear]);

  const getHoursDisplay = (employeeId, clientId, field) => {
    const rowHours = hoursMatrix[`${employeeId}_${clientId}`];
    if (!rowHours) {
      return '-';
    }

    const value = field === 'on' ? rowHours.on : rowHours.off;
    return String(value).padStart(2, '0');
  };

  const getEmployeeTotalHours = (employeeId) => {
    return clients.reduce((sum, client) => {
      const rowHours = hoursMatrix[`${employeeId}_${client.id}`];
      if (!rowHours) {
        return sum;
      }

      return sum + parseHours(rowHours.on) + parseHours(rowHours.off);
    }, 0);
  };

  return (
    <div className="h-screen w-screen bg-slate-50 font-sans
     text-slate-800 flex overflow-hidden">
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
                <h1 className="text-3xl font-black text-slate-900 tracking-tight">Mandays Planning</h1>
              </div>
            </div>

            <div className="inline-flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl p-1.5">
              <button
                type="button"
                onClick={() =>
                  setCurrentDate((prevDate) =>
                    new Date(prevDate.getFullYear(), prevDate.getMonth() - 1, 1)
                  )
                }
                className="h-10 w-10 rounded-lg text-slate-700 hover:bg-white hover:shadow-sm transition-all"
                title="Previous Month"
              >
                <ChevronLeft size={18} className="mx-auto" />
              </button>

              <span className="px-4 text-sm font-bold text-slate-700 min-w-45 text-center">
                {monthLabel}
              </span>

              <button
                type="button"
                onClick={() =>
                  setCurrentDate((prevDate) =>
                    new Date(prevDate.getFullYear(), prevDate.getMonth() + 1, 1)
                  )
                }
                className="h-10 w-10 rounded-lg text-slate-700 hover:bg-white hover:shadow-sm transition-all"
                title="Next Month"
              >
                <ChevronRight size={18} className="mx-auto" />
              </button>
            </div>
          </div>

          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse" style={{ minWidth: minTableWidth }}>
                <thead>
                  <tr className="bg-slate-100 text-slate-800 text-sm">
                    <th
                      rowSpan={2}
                      className="sticky left-0 z-40 border border-slate-300 px-4 py-3 text-left font-black bg-slate-100 w-24 min-w-24"
                    >
                      Sr No
                    </th>
                    <th
                      rowSpan={2}
                      className="sticky z-40 border border-slate-300 px-4 py-3 text-left font-black bg-slate-100"
                      style={{ left: `${srNoColumnWidth}px`, minWidth: `${nameColumnWidth}px` }}
                    >
                      Name
                    </th>
                    {(clients.length ? clients : [{ id: 'fallback', display_name: 'Client 1' }]).map((client) => (
                      <th
                        key={`client-head-${client.id}`}
                        colSpan={2}
                        className="border border-slate-300 px-4 py-3 text-center font-black min-w-55"
                      >
                        {client.display_name}
                      </th>
                    ))}
                    <th rowSpan={2} className="border border-slate-300 px-4 py-3 text-center font-black min-w-30">
                      Total
                    </th>
                  </tr>
                  <tr className="bg-slate-50 text-slate-700 text-xs uppercase tracking-wider">
                    {(clients.length ? clients : [{ id: 'fallback' }]).map((client) => (
                      <React.Fragment key={`client-subhead-${client.id}`}>
                        <th className="border border-slate-300 px-4 py-2 text-center font-black">OnSite</th>
                        <th className="border border-slate-300 px-4 py-2 text-center font-black">Offsite</th>
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
                    hrRows.map((row, index) => (
                      <tr key={`row-${row.employee_id || row.id}`} className="group bg-white hover:bg-slate-50 transition-colors">
                        <td className="sticky left-0 z-30 border border-slate-200 px-4 py-3 font-bold text-slate-600 bg-white group-hover:bg-slate-50 w-24 min-w-24">
                          {index + 1}
                        </td>
                        <td
                          className="sticky z-30 border border-slate-200 px-4 py-3 font-semibold text-slate-800 bg-white group-hover:bg-slate-50"
                          style={{ left: `${srNoColumnWidth}px`, minWidth: `${nameColumnWidth}px` }}
                        >
                          {getEmployeeDisplayName(row)}
                        </td>
                        {(clients.length ? clients : [{ id: 'fallback' }]).map((client) => (
                          <React.Fragment key={`hours-${row.employee_id || row.id}-${client.id}`}>
                            <td className="border border-slate-200 px-4 py-3 text-center font-semibold text-slate-700">
                              {client.id === 'fallback' ? '-' : getHoursDisplay(row.employee_id || row.id, client.id, 'on')}
                            </td>
                            <td className="border border-slate-200 px-4 py-3 text-center font-semibold text-slate-700">
                              {client.id === 'fallback' ? '-' : getHoursDisplay(row.employee_id || row.id, client.id, 'off')}
                            </td>
                          </React.Fragment>
                        ))}
                        <td className="border border-slate-200 px-4 py-3 text-center font-bold text-slate-800">
                          {clients.length ? getEmployeeTotalHours(row.employee_id || row.id) : '-'}
                        </td>
                      </tr>
                    ))
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
            <p className="text-sm font-semibold text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
              {errorMessage}
            </p>
          ) : null}
        </section>
      </main>
    </div>
  );
};

export default MandaysPlanning;
