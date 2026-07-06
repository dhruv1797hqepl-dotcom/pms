import React, { useState, useMemo, useEffect } from 'react';
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import MonthYearPicker from '../components/MonthYearPicker';
import {
  CalendarDays, ChevronLeft, ChevronRight,
  Activity
} from 'lucide-react';
import { SkeletonTableRow } from '../components/SkeletonLoader';
import Sidebar from '../components/Sidebar';
import api from '../api';

// ─────────────────────────────────────────────────────────────────────────────
// Pure helpers
// ─────────────────────────────────────────────────────────────────────────────

// OTC  = truncate(on_time / (total - in_progress) * 100, 1 decimal)
// ATS  = round((on_time*100 + delayed_ats_sum) / (total - in_progress), 1 decimal)
const computeAtsOtc = (tasks) => {
  if (!tasks.length) return { ats: '-', otc: '-' };
  const total = tasks.length;
  const inProgressCount = tasks.filter(t => t.status === 'In Progress').length;
  const denominator = total - inProgressCount;
  if (denominator === 0) return { ats: '-', otc: '-' };

  const onTimeCount = tasks.filter(t => t.status === 'On Time' || t.status === 'Completed').length;
  const delayedAtsSum = tasks
    .filter(t => t.status === 'Delayed')
    .reduce((sum, t) => sum + (parseFloat(t.ats_score) || 0), 0);

  const atsVal = Math.round(((onTimeCount * 100 + delayedAtsSum) / denominator) * 10) / 10;
  const otcVal = Math.trunc((onTimeCount / denominator) * 1000) / 10;

  return {
    ats: atsVal.toFixed(1) + '%',
    otc: otcVal.toFixed(1) + '%',
  };
};

// Average a list of period score objects { ats, otc }
const computeOverallFromPeriodScores = (periodScores) => {
  const getAverage = (key) => {
    const values = periodScores
      .map(item => {
        const val = String(item[key] || '').replace('%', '').trim();
        return Number.parseFloat(val);
      })
      .filter(value => Number.isFinite(value));

    if (!values.length) return '-';
    const sum = values.reduce((acc, value) => acc + value, 0);
    return `${(sum / values.length).toFixed(1)}%`;
  };

  return { ats: getAverage('ats'), otc: getAverage('otc') };
};

const PERIOD_MODES = [
  { key: 'normal', label: 'Normal' },
  { key: 'week',   label: 'Week'   },
  { key: 'month',  label: 'Month'  },
  { key: 'quarter', label: 'Quarter' },
  { key: 'all',     label: 'All Over' },
];

// ─────────────────────────────────────────────────────────────────────────────
// Week / period generators
// ─────────────────────────────────────────────────────────────────────────────

const getWeeksInMonth = (year, month) => {
  const weeks = [];
  const lastDay = new Date(year, month + 1, 0);
  let start = new Date(year, month, 1);
  if (start.getDay() === 0) start.setDate(2);

  let weekCount = 1;
  while (start <= lastDay) {
    let end = new Date(start);
    if (weekCount === 1) {
      let daysToSunday = 7 - end.getDay();
      if (daysToSunday === 7) daysToSunday = 0;
      end.setDate(end.getDate() + daysToSunday);
    } else {
      end.setDate(end.getDate() + 6);
    }
    if (end > lastDay) end = new Date(lastDay);
    const totalDays = Math.floor((end - start) / (1000 * 60 * 60 * 24)) + 1;
    weeks.push({
      label: `W${weekCount}`,
      start: start.getDate(),
      end: end.getDate(),
      isShort: totalDays < 7,
      startDate: new Date(year, month, start.getDate()),
      endDate: new Date(year, month, end.getDate()),
    });
    start = new Date(end);
    start.setDate(start.getDate() + 1);
    weekCount++;
  }
  return weeks;
};

const getWeeksInYear = (year) => {
  const weeks = [];
  const yearEnd = new Date(year, 11, 31);
  let startDate = new Date(year, 0, 1);
  let weekCount = 1;

  while (startDate <= yearEnd) {
    const endDate = new Date(startDate);
    if (weekCount === 1) {
      let daysToSunday = 7 - endDate.getDay();
      if (daysToSunday === 7) daysToSunday = 0;
      endDate.setDate(endDate.getDate() + daysToSunday);
    } else {
      endDate.setDate(endDate.getDate() + 6);
    }
    if (endDate > yearEnd) endDate.setTime(yearEnd.getTime());

    const totalDays = Math.floor((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;
    weeks.push({ label: `W${weekCount}`, startDate, endDate, isShort: totalDays < 7 });

    startDate = new Date(endDate);
    startDate.setDate(startDate.getDate() + 1);
    weekCount += 1;
  }
  return weeks;
};

const formatDateRangeLabel = (startDate, endDate) => {
  const startMonth = startDate.toLocaleString('default', { month: 'short' });
  const endMonth   = endDate.toLocaleString('default',   { month: 'short' });
  if (startMonth === endMonth) {
    return `${startDate.getDate()}-${endDate.getDate()} ${startMonth}`;
  }
  return `${startDate.getDate()} ${startMonth}-${endDate.getDate()} ${endMonth}`;
};

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

const WeeklyScore = () => {
  const [currentDate, setCurrentDate] = useState(() => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });
  const [members,        setMembers]        = useState([]);
  const [allTasks,       setAllTasks]       = useState([]);
  const [scopedClients,  setScopedClients]  = useState([]);
  const [scopedProjects, setScopedProjects] = useState([]);
  const [selectedClient, setSelectedClient] = useState('all');
  const [periodMode,     setPeriodMode]     = useState('normal');
  const [loading,        setLoading]        = useState(true);
  const [currentUser,    setCurrentUser]    = useState(null);
  const [sgmToEmployees, setSgmToEmployees] = useState({});
  const [sendingEmail,   setSendingEmail]   = useState(false);

  const weeks = useMemo(
    () => getWeeksInMonth(currentDate.getFullYear(), currentDate.getMonth()),
    [currentDate]
  );

  const yearWeeks = useMemo(
    () => getWeeksInYear(currentDate.getFullYear()),
    [currentDate]
  );

  // today's midnight for "future period" gating
  const todayMidnight = useMemo(() => {
    const t = new Date();
    return new Date(t.getFullYear(), t.getMonth(), t.getDate());
  }, []);

  const displayPeriods = useMemo(() => {
    if (periodMode === 'all') {
      return [];
    }

    const year      = currentDate.getFullYear();
    const monthName = currentDate.toLocaleString('default', { month: 'short' });

    if (periodMode === 'normal') {
      return weeks.map((wk, idx) => ({
        key: `normal-${idx}`,
        label: wk.label,
        isShort: wk.isShort,
        subLabel: `${wk.start}-${wk.end} ${monthName}`,
        startDate: wk.startDate,
        endDate: wk.endDate,
      }));
    }

    if (periodMode === 'week') {
      return yearWeeks.map((wk, idx) => ({
        key: `week-${idx}`,
        label: wk.label,
        isShort: wk.isShort,
        subLabel: formatDateRangeLabel(wk.startDate, wk.endDate),
        startDate: wk.startDate,
        endDate: wk.endDate,
      }));
    }

    if (periodMode === 'month') {
      return Array.from({ length: 12 }, (_, idx) => {
        const monthStart = new Date(year, idx, 1);
        const monthEnd   = new Date(year, idx + 1, 0);
        return {
          key: `month-${idx}`,
          label: monthStart.toLocaleString('default', { month: 'short' }),
          isShort: false,
          subLabel: `Score for ${monthStart.toLocaleString('default', { month: 'short' })}`,
          startDate: monthStart,
          endDate: monthEnd,
          monthIndex: idx,
        };
      });
    }

    // quarter
    return Array.from({ length: 4 }, (_, idx) => {
      const qStartMonth = idx * 3;
      const qEndMonth   = qStartMonth + 2;
      return {
        key: `quarter-${idx}`,
        label: `Q${idx + 1}`,
        isShort: false,
        subLabel: `${new Date(year, qStartMonth, 1).toLocaleString('default', { month: 'short' })}-${new Date(year, qEndMonth, 1).toLocaleString('default', { month: 'short' })}`,
        startDate: new Date(year, qStartMonth, 1),
        endDate:   new Date(year, qEndMonth + 1, 0),
        quarterIndex: idx,
      };
    });
  }, [periodMode, weeks, yearWeeks, currentDate]);

  // Periods that have started (endDate <= today or startDate <= today)
  // A period is "future" if its start hasn't arrived yet.
  const isFuturePeriod = (period) => {
    return period.startDate > todayMidnight;
  };

  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const response = await api.get('accounts/me/');
        setCurrentUser(response.data);
      } catch (err) {
        console.error('Failed to fetch current user:', err);
        setCurrentUser(null);
      }
    };
    fetchCurrentUser();
  }, []);

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        setLoading(true);
        const params = {};
        if (periodMode !== 'all') {
          params.year = currentDate.getFullYear();
        }
        const response = await api.get('tasks/weekly-score-data/', { params });
        const memberList  = Array.isArray(response.data?.members)  ? response.data.members  : [];
        const taskList    = Array.isArray(response.data?.tasks)    ? response.data.tasks    : [];
        const clientList  = Array.isArray(response.data?.clients)  ? response.data.clients  : [];
        const projectList = Array.isArray(response.data?.projects) ? response.data.projects : [];
        const sgmMapping  = response.data?.sgm_to_employees || {};

        setMembers(memberList);
        setAllTasks(taskList);
        setScopedClients(clientList);
        setScopedProjects(projectList);
        setSgmToEmployees(sgmMapping);
      } catch (err) {
        console.error('Failed to fetch tasks:', err);
        setMembers([]);
        setAllTasks([]);
        setScopedClients([]);
        setScopedProjects([]);
        setSgmToEmployees({});
      } finally {
        setLoading(false);
      }
    };
    fetchTasks();
  }, [currentDate, periodMode]);

  const clientOptions = useMemo(() => {
    if (scopedClients.length > 0) {
      return scopedClients
        .map(client => ({ id: String(client.id), name: client.name || `Client ${client.id}` }))
        .sort((a, b) => a.name.localeCompare(b.name));
    }
    const map = new Map();
    allTasks.forEach(task => {
      if (!task.client_org) return;
      const id = String(task.client_org);
      if (!map.has(id)) map.set(id, { id, name: task.client_name || `Client ${id}` });
    });
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [allTasks, scopedClients]);

  const filteredTasks = useMemo(() => {
    return allTasks.filter(task => {
      if (selectedClient !== 'all' && String(task.client_org) !== selectedClient) return false;
      return true;
    });
  }, [allTasks, selectedClient]);

  // ───────────────────────────────────────────────────────────────────────────
  // Core computation
  // ───────────────────────────────────────────────────────────────────────────

  const teamData = useMemo(() => {
    try {
      const month = currentDate.getMonth();

      const parseTaskDate = (task) => {
        if (!task.target_date) return null;
        const [y, m, d] = String(task.target_date).split('-').map(Number);
        if (!y || !m || !d) return null;
        return new Date(y, m - 1, d);
      };

      const getTasksInRange = (tasks, startDate, endDate) => {
        const startTs = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate()).getTime();
        const endTs   = new Date(endDate.getFullYear(),   endDate.getMonth(),   endDate.getDate(), 23, 59, 59, 999).getTime();
        return tasks.filter(task => {
          const taskDate = parseTaskDate(task);
          if (!taskDate) return false;
          return taskDate.getTime() >= startTs && taskDate.getTime() <= endTs;
        });
      };

      // For a single period: if it's a future period, return '-' for everything
      const computePeriodScore = (tasks, period) => {
        if (isFuturePeriod(period)) return { ats: '-', otc: '-' };
        return computeAtsOtc(getTasksInRange(tasks, period.startDate, period.endDate));
      };

      const getPeriodData = (tasks) => {
        if (periodMode === 'all') {
          return [];
        }
        if (periodMode === 'normal' || periodMode === 'week') {
          return displayPeriods.map(period => computePeriodScore(tasks, period));
        }

        if (periodMode === 'month') {
          const weekScores = yearWeeks.map(wk => ({
            ...computeAtsOtc(getTasksInRange(tasks, wk.startDate, wk.endDate)),
            monthIndex: wk.startDate.getMonth(),
          }));
          return displayPeriods.map(period => {
            if (isFuturePeriod(period)) return { ats: '-', otc: '-' };
            const scores = weekScores
              .filter(item => item.monthIndex === period.monthIndex)
              .map(item => ({ ats: item.ats, otc: item.otc }));
            return computeOverallFromPeriodScores(scores);
          });
        }

        // quarter
        const weekScores = yearWeeks.map(wk => ({
          ...computeAtsOtc(getTasksInRange(tasks, wk.startDate, wk.endDate)),
          monthIndex: wk.startDate.getMonth(),
        }));
        return displayPeriods.map(period => {
          if (isFuturePeriod(period)) return { ats: '-', otc: '-' };
          const qStart = period.quarterIndex * 3;
          const qEnd   = qStart + 2;
          const scores = weekScores
            .filter(item => item.monthIndex >= qStart && item.monthIndex <= qEnd)
            .map(item => ({ ats: item.ats, otc: item.otc }));
          return computeOverallFromPeriodScores(scores);
        });
      };

      // Overall Avg = average of DISPLAYED (non-future) period scores only
      const getOverallAvg = (periodData) => {
        const validScores = periodData.filter(d => d.ats !== '-' || d.otc !== '-');
        return computeOverallFromPeriodScores(validScores);
      };

      const computeEmployeeRow = (employeeId, employeeName, tasks) => {
        try {
          const periodData = getPeriodData(tasks);
          const overall    = periodMode === 'all' ? computeAtsOtc(tasks) : getOverallAvg(periodData);
          return { id: employeeId, name: employeeName, periodData, overall, isEmployee: true };
        } catch (err) {
          console.error(`Error computing row for employee ${employeeId}:`, err);
          return {
            id: employeeId, name: employeeName,
            periodData: displayPeriods.map(() => ({ ats: '-', otc: '-' })),
            overall: { ats: '-', otc: '-' },
            isEmployee: true, error: true,
          };
        }
      };

      const computeProjectRow = (projectId, projectName, tasks) => {
        try {
          const periodData = getPeriodData(tasks);
          const overall    = periodMode === 'year' ? computeAtsOtc(tasks) : getOverallAvg(periodData);
          return { id: projectId, name: projectName, periodData, overall, isProject: true };
        } catch (err) {
          return {
            id: projectId, name: projectName,
            periodData: displayPeriods.map(() => ({ ats: '-', otc: '-' })),
            overall: { ats: '-', otc: '-' },
            isProject: true, error: true,
          };
        }
      };

      const getMemberById = (id) => {
        const m = members.find(m => m.id === id);
        if (m) return m;
        if (id === currentUser?.id && currentUser) {
          return {
            id: currentUser.id,
            name: `${currentUser.first_name || ''} ${currentUser.last_name || ''}`.trim() || currentUser.username || 'User',
            role: currentUser.role,
          };
        }
        return null;
      };

      if (!currentUser) return [];

      const employeeTaskMap = {};
      members.forEach(member => { employeeTaskMap[member.id] = []; });

      const userRole = (currentUser.role || '').toUpperCase();
      if ((userRole === 'EMPLOYEE' || userRole === 'EXTERNAL') && currentUser.id) {
        if (!employeeTaskMap[currentUser.id]) employeeTaskMap[currentUser.id] = [];
      }

      filteredTasks.forEach(task => {
        if (!task.assigned_to) return;
        const empId = task.assigned_to;
        if (!employeeTaskMap[empId]) employeeTaskMap[empId] = [];
        employeeTaskMap[empId].push(task);
      });

      if ((userRole === 'EMPLOYEE' || userRole === 'EXTERNAL') && currentUser.id && employeeTaskMap[currentUser.id] !== undefined) {
        const member = getMemberById(currentUser.id);
        return [computeEmployeeRow(currentUser.id, member?.name || `User ${currentUser.id}`, employeeTaskMap[currentUser.id])];
      }

      if (!members.length) return [];

      const projectTaskMap = {};
      filteredTasks.forEach(task => {
        if (!task.project_id && !task.project && !task.project_name) return;
        const projectId   = task.project_id || String(task.project);
        const projectName = task.project_name?.trim()
          ? task.project_name
          : (projectId && projectId !== 'null' ? `Project ${projectId}` : 'Unassigned Project');
        if (!projectTaskMap[projectId]) projectTaskMap[projectId] = { name: projectName, tasks: [] };
        projectTaskMap[projectId].tasks.push(task);
      });

      const getAllProjectsForSelection = () => {
        if (selectedClient === 'all') {
          return scopedProjects.map(proj => ({ projectId: proj.id, projectName: proj.name, clientId: proj.client_id }));
        }
        const clientId = parseInt(selectedClient);
        return scopedProjects
          .filter(proj => proj.client_id === clientId)
          .map(proj => ({ projectId: proj.id, projectName: proj.name, clientId: proj.client_id }));
      };

      if (userRole === 'EMPLOYEE' || userRole === 'EXTERNAL') {
        if (currentUser.id && employeeTaskMap[currentUser.id] !== undefined) {
          const member = getMemberById(currentUser.id);
          return [computeEmployeeRow(currentUser.id, member?.name || `User ${currentUser.id}`, employeeTaskMap[currentUser.id])];
        }
        return [];
      } else if (userRole === 'SGM') {
        if (selectedClient !== 'all') {
          return getAllProjectsForSelection()
            .map(p => computeProjectRow(p.projectId, p.projectName, projectTaskMap[p.projectId]?.tasks || []))
            .sort((a, b) => a.name.localeCompare(b.name));
        }
        const result = [];
        const managedEmployeeIds = Array.from(new Set(sgmToEmployees[currentUser.id] || []));
        if (currentUser.id && employeeTaskMap[currentUser.id] !== undefined) {
          const sgmMember = getMemberById(currentUser.id);
          result.push(computeEmployeeRow(currentUser.id, sgmMember?.name || `SGM ${currentUser.id}`, employeeTaskMap[currentUser.id]));
        }
        managedEmployeeIds.forEach(empId => {
          const empMember = getMemberById(empId);
          if (empMember && (empMember.role || '').toUpperCase() === 'EMPLOYEE' && employeeTaskMap[empId] !== undefined) {
            result.push(computeEmployeeRow(empId, empMember.name, employeeTaskMap[empId]));
          }
        });
        return result.sort((a, b) => {
          if (a.id === currentUser.id) return -1;
          if (b.id === currentUser.id) return 1;
          return a.name.localeCompare(b.name);
        });
      } else if (userRole === 'SENIOR') {
        if (selectedClient !== 'all') {
          return getAllProjectsForSelection()
            .map(p => computeProjectRow(p.projectId, p.projectName, projectTaskMap[p.projectId]?.tasks || []))
            .sort((a, b) => a.name.localeCompare(b.name));
        }
        const externalRoles = { SENIOR: 0, EXTERNAL: 1 };
        const uniqueMembers = new Map();
        members.forEach(member => {
          const role = (member.role || '').toUpperCase();
          if (role !== 'SENIOR' && role !== 'EXTERNAL') return;
          if (!uniqueMembers.has(member.id)) uniqueMembers.set(member.id, member);
        });
        return Array.from(uniqueMembers.values())
          .map(member => ({
            ...computeEmployeeRow(member.id, member.name, employeeTaskMap[member.id] || []),
            role: (member.role || '').toUpperCase(),
          }))
          .sort((a, b) => {
            const prA = externalRoles[a.role] ?? 99;
            const prB = externalRoles[b.role] ?? 99;
            if (prA !== prB) return prA - prB;
            return a.name.localeCompare(b.name);
          });
      } else {
        // HQEPL / ADMIN / MLS
        if (selectedClient !== 'all') {
          return getAllProjectsForSelection()
            .map(p => computeProjectRow(p.projectId, p.projectName, projectTaskMap[p.projectId]?.tasks || []))
            .sort((a, b) => a.name.localeCompare(b.name));
        }
        const rolePriority = { SGM: 0, EMPLOYEE: 1 };
        const uniqueMembers = new Map();
        members.forEach(member => {
          const role = (member.role || '').toUpperCase();
          if (role !== 'SGM' && role !== 'EMPLOYEE') return;
          if (!uniqueMembers.has(member.id)) uniqueMembers.set(member.id, member);
        });
        return Array.from(uniqueMembers.values())
          .map(member => ({
            ...computeEmployeeRow(member.id, member.name, employeeTaskMap[member.id] || []),
            role: (member.role || '').toUpperCase(),
          }))
          .sort((a, b) => {
            const prA = rolePriority[a.role] ?? 99;
            const prB = rolePriority[b.role] ?? 99;
            if (prA !== prB) return prA - prB;
            return a.name.localeCompare(b.name);
          });
      }
    } catch (err) {
      console.error('Error computing team data:', err);
      return [];
    }
  }, [filteredTasks, weeks, yearWeeks, displayPeriods, periodMode, currentDate, members, currentUser, sgmToEmployees, scopedProjects, selectedClient, todayMidnight]);



  // ─────────────────────────────────────────────────────────────────────────────
  // Misc
  // ─────────────────────────────────────────────────────────────────────────────

  const monthName = periodMode === 'normal'
    ? currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })
    : periodMode === 'all'
    ? 'All Over'
    : String(currentDate.getFullYear());

  const getScoreColor = (scoreStr) => {
    if (scoreStr === '-') return 'text-slate-400';
    const val = parseFloat(scoreStr);
    if (isNaN(val)) return 'text-slate-400';
    if (val >= 80) return 'text-green-600 font-semibold';
    if (val >= 60) return 'text-amber-600 font-semibold';
    return 'text-red-600 font-semibold';
  };

  const totalCols = 2 + displayPeriods.length * 2 + 2;

  const handleSendEmail = () => {
    setSendingEmail(true);
    api.post('/tasks/send-weekly-score-email/', {})
      .then(response => {
        alert("Email report sent successfully!");
      })
      .catch(err => {
        console.error("Failed to send email:", err);
        alert("Failed to send email report.");
      })
      .finally(() => {
        setSendingEmail(false);
      });
  };

  const handleDownloadPDF = () => {
    let startStr = '';
    let endStr = '';
    let titlePrefix = '';

    if (periodMode === 'all') {
      startStr = '2000-01-01';
      endStr = '2100-12-31';
      titlePrefix = "All Over";
    } else if (displayPeriods.length > 0) {
      const firstPeriod = displayPeriods[0];
      const lastPeriod  = displayPeriods[displayPeriods.length - 1];

      const toIsoStr = (d) => {
        if (!d) return '';
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const dt = String(d.getDate()).padStart(2, '0');
        return `${y}-${m}-${dt}`;
      };

      startStr = toIsoStr(firstPeriod.startDate);
      endStr = toIsoStr(lastPeriod.endDate);

      if (periodMode === 'normal') titlePrefix = "Monthly";
      else if (periodMode === 'week') titlePrefix = "Weekly";
      else if (periodMode === 'month') titlePrefix = "Yearly";
      else if (periodMode === 'quarter') titlePrefix = "Quarterly";
    }

    if (startStr && endStr) {
      api.get('/tasks/download-weekly-score-pdf/', {
        params: {
          start_date: startStr,
          end_date: endStr,
          title_prefix: titlePrefix
        },
        responseType: 'blob'
      })
      .then(response => {
        const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
        const a = document.createElement('a');
        a.href = url;
        a.download = `score_report_${startStr}_to_${endStr}.pdf`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
      })
      .catch(err => {
        console.error("PDF download failed:", err);
        alert("Failed to download PDF score report.");
      });
    }
  };

  const handleNavigatePeriod = (direction) => {
    setCurrentDate(prev => {
      if (periodMode === 'normal') {
        return new Date(prev.getFullYear(), prev.getMonth() + direction, 1);
      }
      return new Date(prev.getFullYear() + direction, prev.getMonth(), 1);
    });
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <div className="h-screen w-screen bg-gray-50 font-sans text-slate-800 flex overflow-hidden">
      <Sidebar />

      <main className="flex-1 overflow-y-auto transition-all duration-300">
        <div className="max-w-full mx-auto px-3 md:px-6 py-4 md:py-8 space-y-4 md:space-y-6">

          {/* HEADER */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-4 md:p-6 rounded-xl border border-slate-200 shadow-sm gap-3 md:gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-600 rounded-lg text-white shadow-md shadow-blue-200">
                <CalendarDays size={24} />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Planning Period</p>
                <h1 className="text-xl md:text-2xl font-bold text-slate-900">{monthName}</h1>
              </div>
            </div>

            <div className="flex items-center gap-1.5 bg-slate-100 rounded-lg p-1 border border-slate-200">
              {PERIOD_MODES.map(mode => (
                <button
                  key={mode.key}
                  onClick={() => setPeriodMode(mode.key)}
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold uppercase tracking-wide transition-all ${
                    periodMode === mode.key
                      ? 'bg-white text-amber-600 shadow-sm'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  {mode.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-lg border border-slate-100">
              <button
                onClick={() => handleNavigatePeriod(-1)}
                disabled={periodMode === 'all'}
                className={`p-2 rounded-md transition-all text-slate-600 ${periodMode === 'all' ? 'opacity-40 cursor-not-allowed' : 'hover:bg-white hover:shadow-sm'}`}
              >
                <ChevronLeft size={18} />
              </button>
              {periodMode !== 'all' ? (
                <MonthYearPicker
                  selectedMonth={currentDate.getMonth() + 1}
                  selectedYear={currentDate.getFullYear()}
                  onChange={(y, m) => {
                    setCurrentDate(new Date(y, m - 1, 1));
                  }}
                  label={
                    <span className="px-3 text-sm font-black uppercase tracking-widest text-slate-700 min-w-[120px] text-center cursor-pointer hover:text-blue-600 block">
                      {periodMode === 'normal' || periodMode === 'week' 
                        ? `${currentDate.toLocaleString('default', { month: 'short' })} ${currentDate.getFullYear()}` 
                        : currentDate.getFullYear()}
                    </span>
                  }
                />
              ) : (
                <span className="px-3 text-sm font-medium text-slate-600 min-w-[120px] text-center">
                  All Time
                </span>
              )}
              <button
                onClick={() => handleNavigatePeriod(1)}
                disabled={periodMode === 'all'}
                className={`p-2 rounded-md transition-all text-slate-600 ${periodMode === 'all' ? 'opacity-40 cursor-not-allowed' : 'hover:bg-white hover:shadow-sm'}`}
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>

          {/* FILTERS */}
          {currentUser?.role !== 'EMPLOYEE' && currentUser?.role !== 'EXTERNAL' && (
            <div className="bg-white p-3 md:p-4 rounded-xl border border-slate-200 shadow-sm">
              <div className="flex flex-col lg:flex-row gap-4 lg:items-end">
                <div className="w-full lg:max-w-sm">
                  <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1.5">
                    Client View
                  </label>
                  <select
                    value={selectedClient}
                    onChange={e => setSelectedClient(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-200"
                  >
                    <option value="all">All Clients</option>
                    {clientOptions.map(client => (
                      <option key={client.id} value={client.id}>{client.name}</option>
                    ))}
                  </select>
                </div>
                <div className="text-xs text-slate-500 lg:ml-auto">
                  Showing {filteredTasks.length} task{filteredTasks.length === 1 ? '' : 's'} in this view
                </div>
              </div>
            </div>
          )}

          {/* PERFORMANCE TABLE */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            <div className="p-4 md:p-6 border-b border-slate-100 flex justify-between items-center">
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Activity className="text-blue-600" size={20} />
                Performance Overview
              </h2>
              {(currentUser?.role === 'ADMIN' || currentUser?.role === 'HQEPL' || currentUser?.role === 'MLS') && periodMode === 'all' && (
                <div className="flex gap-2">
                  <button
                    onClick={handleSendEmail}
                    disabled={sendingEmail}
                    className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-xs font-semibold shadow-md transition-all disabled:opacity-55 disabled:cursor-not-allowed"
                  >
                    {sendingEmail ? "Sending..." : "Send Email"}
                  </button>
                  <button
                    onClick={handleDownloadPDF}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-xs font-semibold shadow-md transition-all"
                  >
                    Download PDF
                  </button>
                </div>
              )}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left border-collapse">
                <thead className="bg-slate-50 text-slate-600 font-semibold text-xs uppercase">
                  {/* Row 1: group headers */}
                  <tr>
                    <th rowSpan={2} className="px-4 py-3 border border-slate-200 text-center whitespace-nowrap w-16">
                      Sr. No.
                    </th>
                    <th rowSpan={2} className="px-6 py-3 border border-slate-200 whitespace-nowrap">
                      Name
                    </th>
                    {displayPeriods.map((wk, i) => (
                      <th key={i} colSpan={2} className="px-4 py-3 border border-slate-200 text-center">
                        <div className="flex flex-col items-center gap-0.5">
                          <span className={wk.isShort ? 'text-amber-600' : ''}>{wk.label}</span>
                          <span className="text-[10px] font-normal normal-case text-slate-400">
                            {wk.subLabel}
                          </span>
                          {wk.isShort && (
                            <span className="text-[9px] bg-amber-100 text-amber-700 px-1.5 rounded-full">SHORT</span>
                          )}
                        </div>
                      </th>
                    ))}
                    <th colSpan={2} className="px-4 py-3 border border-slate-200 text-center whitespace-nowrap">
                      Overall Avg.
                    </th>
                  </tr>
                  {/* Row 2: ATS / OTC sub-headers */}
                  <tr>
                    {displayPeriods.map((_, i) => (
                      <React.Fragment key={i}>
                        <th className="px-3 py-2 border border-slate-200 text-center text-[11px] tracking-wide">ATS</th>
                        <th className="px-3 py-2 border border-slate-200 text-center text-[11px] tracking-wide">OTC</th>
                      </React.Fragment>
                    ))}
                    <th className="px-3 py-2 border border-slate-200 text-center text-[11px] tracking-wide">ATS</th>
                    <th className="px-3 py-2 border border-slate-200 text-center text-[11px] tracking-wide">OTC</th>
                  </tr>
                </thead>

                <tbody>
                  {loading ? (
                    Array.from({ length: 5 }).map((_, idx) => (
                      <SkeletonTableRow key={idx} columns={totalCols || 8} />
                    ))
                  ) : teamData.length === 0 ? (
                    <tr>
                      <td colSpan={totalCols} className="px-6 py-8 text-center text-slate-500">
                        No team data available for this period.
                      </td>
                    </tr>
                  ) : (
                    <>


                      {/* ── INDIVIDUAL ROWS ── */}
                      {teamData.map((item, idx) => {
                        const isSGM = (
                          currentUser?.role === 'HQEPL' ||
                          currentUser?.role === 'MLS' ||
                          currentUser?.role === 'ADMIN'
                        ) ? !item.isSubordinate && members.find(m => m.id === item.id)?.role === 'SGM' : false;

                        const isSubordinate = item.isSubordinate;
                        const isProject     = item.isProject;

                        return (
                          <tr
                            key={item.id || idx}
                            className={`border-b border-slate-100 transition-colors ${
                              isProject    ? 'bg-emerald-50 hover:bg-emerald-100' :
                              isSGM        ? 'bg-blue-50 hover:bg-blue-100' :
                              isSubordinate ? 'hover:bg-slate-50' :
                              'hover:bg-slate-50'
                            }`}
                          >
                            <td className="px-4 py-3 border border-slate-100 text-center text-slate-500 text-xs">
                              {isSubordinate ? '↳' : idx + 1}
                            </td>
                            <td className="px-6 py-3 border border-slate-100">
                              {item.isEmployee ? (
                                <div className={`flex items-center gap-3 ${isSubordinate ? 'pl-4' : ''}`}>
                                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                                    isSGM ? 'bg-blue-600 text-white' : 'bg-blue-100 text-blue-600'
                                  }`}>
                                    {(item.name || 'U').trim().split(/\s+/).slice(0, 2).map(p => p[0]).join('').toUpperCase()}
                                  </div>
                                  <div>
                                    <span className={`font-medium ${isSGM ? 'text-blue-700' : 'text-slate-700'}`}>
                                      {item.name}
                                    </span>
                                    {isSGM && <div className="text-xs text-slate-500">SGM</div>}
                                  </div>
                                </div>
                              ) : isProject ? (
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 bg-emerald-600 text-white">
                                    {(item.name || 'P').trim().split(/\s+/).slice(0, 2).map(p => p[0]).join('').toUpperCase()}
                                  </div>
                                  <div>
                                    <span className="font-medium text-emerald-700">{item.name}</span>
                                    <div className="text-xs text-slate-500">Project</div>
                                  </div>
                                </div>
                              ) : (
                                <span className="font-medium text-slate-700">{item.name}</span>
                              )}
                            </td>

                            {item.periodData.map((wd, i) => (
                              <React.Fragment key={i}>
                                <td className={`px-3 py-3 border border-slate-100 text-center text-xs ${getScoreColor(wd.ats)}`}>
                                  {wd.ats}
                                </td>
                                <td className={`px-3 py-3 border border-slate-100 text-center text-xs ${getScoreColor(wd.otc)}`}>
                                  {wd.otc}
                                </td>
                              </React.Fragment>
                            ))}

                            <td className={`px-3 py-3 border border-slate-100 text-center text-xs ${getScoreColor(item.overall.ats)}`}>
                              {item.overall.ats}
                            </td>
                            <td className={`px-3 py-3 border border-slate-100 text-center text-xs ${getScoreColor(item.overall.otc)}`}>
                              {item.overall.otc}
                            </td>
                          </tr>
                        );
                      })}
                    </>
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
};

export default WeeklyScore;