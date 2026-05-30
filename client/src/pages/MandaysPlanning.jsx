import React, { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, CalendarDays, Loader2, Download } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import api from '../api';
import { subscribeToDdtmePlanningRefresh } from '../utils/ddtmePlanningRefresh';
import * as XLSX from 'xlsx';

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
  const [summaryRows, setSummaryRows] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const [isCurrentUserLoading, setIsCurrentUserLoading] = useState(true);
  const [refreshTick, setRefreshTick] = useState(0);
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
    return subscribeToDdtmePlanningRefresh(() => {
      setRefreshTick((value) => value + 1);
    });
  }, []);

  useEffect(() => {
    const fetchPlanningData = async () => {
      try {
        setIsLoading(true);
        setErrorMessage('');
        setClients([]);
        setHrRows([]);
        setHoursMatrix({});
        setSummaryRows([]);

        const role = (localStorage.getItem('role') || '').toUpperCase();
        const isSgm = role === 'SGM';
        const isEmployee = role === 'EMPLOYEE';
        const isPrivilegedViewer = role === 'HQEPL' || role === 'MLS' || role === 'ADMIN';

        // Skip if we're still waiting for currentUser to load (for SGM/EMPLOYEE roles)
        if ((isSgm || isEmployee) && isCurrentUserLoading) {
          return;
        }

        const employeeScopedProfileId = getResolvedEmployeeProfileId(currentUser)
          || String(currentUser?.employee_id || '').trim();

        const summaryResponse = await api.get('ddtme/man-day-entries/summary/', {
          params: {
            month: selectedMonth,
            year: selectedYear,
            view: 'mandays',
            ...(isEmployee && employeeScopedProfileId ? { employee_id: employeeScopedProfileId } : {}),
          },
        });

        const rawSummaryRows = unwrapList(summaryResponse.data);
        const seenRecordIds = new Set();
        const duplicateRecordIds = [];
        const nextSummaryRows = rawSummaryRows.map((entry) => {
          const recordIds = Array.isArray(entry.record_ids) ? entry.record_ids : [];
          recordIds.forEach((recordId) => {
            const key = String(recordId || '');
            if (!key) return;
            if (seenRecordIds.has(key)) {
              duplicateRecordIds.push(key);
              return;
            }
            seenRecordIds.add(key);
          });

          const planHours = parseHours(entry.plan_hours);
          const offHours = parseHours(entry.off_hours);
          const onsiteDays = planHours / 6;
          const offsiteDays = offHours / 7.5;
          const totalHours = planHours + offHours;
          const totalDays = onsiteDays + offsiteDays;

          return {
            ...entry,
            plan_hours: planHours,
            off_hours: offHours,
            onsite_days: onsiteDays,
            offsite_days: offsiteDays,
            total_hours: totalHours,
            total_days: totalDays,
          };
        }).sort((a, b) => getEmployeeDisplayName(a).localeCompare(getEmployeeDisplayName(b)));

        const totalFetchedRecords = rawSummaryRows.reduce((sum, item) => sum + Number(item.records || 0), 0);
        const totalPlanHours = nextSummaryRows.reduce((sum, item) => sum + parseHours(item.plan_hours), 0);
        const totalOffHours = nextSummaryRows.reduce((sum, item) => sum + parseHours(item.off_hours), 0);
        const totalHours = totalPlanHours + totalOffHours;
        const totalDays = nextSummaryRows.reduce((sum, item) => sum + parseHours(item.total_days), 0);

        console.debug('[Mandays Planning] DDTME records fetched:', totalFetchedRecords);
        console.debug('[Mandays Planning] Summary rows returned:', nextSummaryRows.length);
        console.debug('[Mandays Planning] Total Hours calculated:', {
          onsite: totalPlanHours,
          offsite: totalOffHours,
          total: totalHours,
        });
        console.debug('[Mandays Planning] Total Days calculated:', {
          total: totalDays,
        });
        if (duplicateRecordIds.length > 0) {
          console.warn('[Mandays Planning] Duplicate DDTME records detected during aggregation:', Array.from(new Set(duplicateRecordIds)));
        }

        setSummaryRows(nextSummaryRows);
        setIsLoading(false);
        return;

      } catch (error) {
        console.error('Failed to load mandays planning data:', error);
        setErrorMessage('Unable to load clients and HR planning data.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchPlanningData();
  }, [selectedMonth, selectedYear, currentUser, currentUserDisplayName, isCurrentUserLoading, refreshTick]);

  const getDaysDisplay = (employeeId, clientId, field) => {
    const rowHours = hoursMatrix[`${employeeId}_${clientId}`];
    if (!rowHours) return '-';

    const hours = field === 'on' ? parseHours(rowHours.on) : parseHours(rowHours.off);
    if (hours === 0) return '-';
    const days = field === 'on' ? hours / 6 : hours / 7.5;
    return days % 1 === 0 ? String(days) : days.toFixed(2);
  };

  const getEmployeeTotalOnsiteDays = (employeeId) => {
    const total = clients.reduce((sum, client) => {
      const rowHours = hoursMatrix[`${employeeId}_${client.id}`];
      if (!rowHours) return sum;
      return sum + parseHours(rowHours.on) / 6;
    }, 0);
    return total % 1 === 0 ? String(total) : total.toFixed(2);
  };

  const getEmployeeTotalOffsiteDays = (employeeId) => {
    const total = clients.reduce((sum, client) => {
      const rowHours = hoursMatrix[`${employeeId}_${client.id}`];
      if (!rowHours) return sum;
      return sum + parseHours(rowHours.off) / 7.5;
    }, 0);
    return total % 1 === 0 ? String(total) : total.toFixed(2);
  };

  const getEmployeeTotalDays = (employeeId) => {
    const total = clients.reduce((sum, client) => {
      const rowHours = hoursMatrix[`${employeeId}_${client.id}`];
      if (!rowHours) return sum;

      const onsiteDays = parseHours(rowHours.on) / 6;
      const offsiteDays = parseHours(rowHours.off) / 7.5;
      return sum + onsiteDays + offsiteDays;
    }, 0);

    return total % 1 === 0 ? String(total) : total.toFixed(2);
  };

  const allEmployeesTotals = useMemo(() => {
    const totals = hrRows.reduce(
      (accumulator, employee) => {
        clients.forEach((client) => {
          const rowHours = hoursMatrix[`${employee.id}_${client.id}`];
          if (!rowHours) return;

          accumulator.onsite += parseHours(rowHours.on) / 6;
          accumulator.offsite += parseHours(rowHours.off) / 7.5;
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

  const summaryTotals = useMemo(() => {
    const onsiteHours = summaryRows.reduce((sum, row) => sum + parseHours(row.plan_hours), 0);
    const offsiteHours = summaryRows.reduce((sum, row) => sum + parseHours(row.off_hours), 0);
    const totalHours = onsiteHours + offsiteHours;
    const onsiteDays = onsiteHours / 6;
    const offsiteDays = offsiteHours / 7.5;
    const totalDays = onsiteDays + offsiteDays;

    return {
      onsiteHours,
      offsiteHours,
      totalHours,
      onsiteDays: formatDaysValue(onsiteDays),
      offsiteDays: formatDaysValue(offsiteDays),
      totalDays: formatDaysValue(totalDays),
    };
  }, [summaryRows]);

  const handleDownloadExcel = () => {
    const workbook = XLSX.utils.book_new();
    const data = [
      ['Sr No', 'Employee', 'Records', 'Onsite Hrs', 'Offsite Hrs', 'Total Hrs', 'Onsite Days', 'Offsite Days', 'Total Days'],
      ...summaryRows.map((row, index) => [
        index + 1,
        getEmployeeDisplayName(row),
        row.records || 0,
        formatDaysValue(row.plan_hours),
        formatDaysValue(row.off_hours),
        formatDaysValue(row.total_hours),
        formatDaysValue(row.onsite_days),
        formatDaysValue(row.offsite_days),
        formatDaysValue(row.total_days),
      ]),
      ['-', 'Total (All Employees)', summaryRows.reduce((sum, row) => sum + Number(row.records || 0), 0), formatDaysValue(summaryTotals.onsiteHours), formatDaysValue(summaryTotals.offsiteHours), formatDaysValue(summaryTotals.totalHours), summaryTotals.onsiteDays, summaryTotals.offsiteDays, summaryTotals.totalDays],
    ];

    const worksheet = XLSX.utils.aoa_to_sheet(data);
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Mandays Planning');
    XLSX.writeFile(workbook, `Mandays_Planning_${monthLabel.replace(' ', '_')}.xlsx`);
  };

  return (
    <div className="h-screen w-screen bg-slate-50 font-sans text-slate-800 flex overflow-hidden">
      <Sidebar />

      <main className="flex-1 overflow-y-auto px-6 py-8">
        <section className="max-w-6xl mx-auto border border-slate-200 bg-white rounded-2xl shadow-sm overflow-hidden p-6 md:p-8 space-y-6 min-h-180">
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
                <p className="mt-1 text-sm font-semibold text-slate-500">Source: monthly DDTME summary</p>
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

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">Employees</div>
              <div className="mt-1 text-2xl font-black text-slate-900">{summaryRows.length}</div>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">Onsite Hrs</div>
              <div className="mt-1 text-2xl font-black text-slate-900">{formatDaysValue(summaryTotals.onsiteHours)}</div>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">Offsite Hrs</div>
              <div className="mt-1 text-2xl font-black text-slate-900">{formatDaysValue(summaryTotals.offsiteHours)}</div>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">Total Days</div>
              <div className="mt-1 text-2xl font-black text-slate-900">{summaryTotals.totalDays}</div>
            </div>
          </div>

          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse min-w-245">
                <thead>
                  <tr className="bg-slate-100 text-slate-800 text-xs uppercase tracking-wider">
                    <th className="border border-slate-300 px-3 py-3 text-left font-black">Sr No</th>
                    <th className="border border-slate-300 px-3 py-3 text-left font-black">Employee</th>
                    <th className="border border-slate-300 px-3 py-3 text-center font-black">Records</th>
                    <th className="border border-slate-300 px-3 py-3 text-center font-black">Onsite Hrs</th>
                    <th className="border border-slate-300 px-3 py-3 text-center font-black">Offsite Hrs</th>
                    <th className="border border-slate-300 px-3 py-3 text-center font-black">Total Hrs</th>
                    <th className="border border-slate-300 px-3 py-3 text-center font-black">Onsite Days</th>
                    <th className="border border-slate-300 px-3 py-3 text-center font-black">Offsite Days</th>
                    <th className="border border-slate-300 px-3 py-3 text-center font-black">Total Days</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr>
                      <td colSpan={9} className="border border-slate-200 px-4 py-16">
                        <div className="flex items-center justify-center gap-3 text-slate-500 font-semibold">
                          <Loader2 size={20} className="animate-spin" />
                          Loading DDTME monthly summary...
                        </div>
                      </td>
                    </tr>
                  ) : summaryRows.length > 0 ? (
                    <>
                      {summaryRows.map((row, index) => (
                        <tr key={`${row.employee_id}-${index}`} className="bg-white hover:bg-slate-50 transition-colors text-sm">
                          <td className="border border-slate-200 px-3 py-2 font-bold text-slate-600">{index + 1}</td>
                          <td className="border border-slate-200 px-3 py-2 font-semibold text-slate-800">{getEmployeeDisplayName(row)}</td>
                          <td className="border border-slate-200 px-3 py-2 text-center font-semibold text-slate-700">{row.records || 0}</td>
                          <td className="border border-slate-200 px-3 py-2 text-center font-semibold text-slate-700">{formatDaysValue(row.plan_hours)}</td>
                          <td className="border border-slate-200 px-3 py-2 text-center font-semibold text-slate-700">{formatDaysValue(row.off_hours)}</td>
                          <td className="border border-slate-200 px-3 py-2 text-center font-black text-slate-900">{formatDaysValue(row.total_hours)}</td>
                          <td className="border border-slate-200 px-3 py-2 text-center font-semibold text-slate-700">{formatDaysValue(row.onsite_days)}</td>
                          <td className="border border-slate-200 px-3 py-2 text-center font-semibold text-slate-700">{formatDaysValue(row.offsite_days)}</td>
                          <td className="border border-slate-200 px-3 py-2 text-center font-black text-slate-900">{formatDaysValue(row.total_days)}</td>
                        </tr>
                      ))}

                      <tr className="bg-slate-100 text-sm">
                        <td className="border border-slate-300 px-3 py-2 font-black text-slate-700">-</td>
                        <td className="border border-slate-300 px-3 py-2 font-black text-slate-800">Total (All Employees)</td>
                        <td className="border border-slate-300 px-3 py-2 text-center font-black text-slate-800">{summaryRows.reduce((sum, row) => sum + Number(row.records || 0), 0)}</td>
                        <td className="border border-slate-300 px-3 py-2 text-center font-black text-slate-900">{formatDaysValue(summaryTotals.onsiteHours)}</td>
                        <td className="border border-slate-300 px-3 py-2 text-center font-black text-slate-900">{formatDaysValue(summaryTotals.offsiteHours)}</td>
                        <td className="border border-slate-300 px-3 py-2 text-center font-black text-slate-900">{formatDaysValue(summaryTotals.totalHours)}</td>
                        <td className="border border-slate-300 px-3 py-2 text-center font-black text-slate-900">{summaryTotals.onsiteDays}</td>
                        <td className="border border-slate-300 px-3 py-2 text-center font-black text-slate-900">{summaryTotals.offsiteDays}</td>
                        <td className="border border-slate-300 px-3 py-2 text-center font-black text-slate-900">{summaryTotals.totalDays}</td>
                      </tr>
                    </>
                  ) : (
                    <tr>
                      <td colSpan={9} className="border border-slate-200 px-4 py-12 text-center text-slate-500 font-semibold">
                        No DDTME records found for the selected month.
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