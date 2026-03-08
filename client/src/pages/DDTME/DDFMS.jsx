import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Box } from 'lucide-react';
import Sidebar from '../../components/Sidebar';
import api from '../../api';

const DDFMS_ENDPOINTS = {
  steps: '/ddfms/steps/',
  stepById: (stepId) => `/ddfms/steps/${encodeURIComponent(stepId)}/`,
  deliverables: '/ddfms/deliverables/',
  deliverableById: (deliverableId) => `/ddfms/deliverables/${encodeURIComponent(deliverableId)}/`,
  plans: '/ddfms/plans/',
  planById: (planId) => `/ddfms/plans/${encodeURIComponent(planId)}/`,
  submissions: '/ddtme/submissions/',
  bigTasks: '/ddtme/big-tasks/',
  additionalTasks: '/ddtme/additional-tasks/',
  manDayEntries: '/ddtme/man-day-entries/',
  employeeProjects: '/employees/my-projects/',
  projects: '/projects/',
  sgmProjects: '/sgm/projects/',
  clientById: (clientId) => `/clients/${encodeURIComponent(clientId)}/`,
  clientEmployees: (clientId) => `/clients/${encodeURIComponent(clientId)}/employees/`,
};

const DDFMS = () => {
  const { clientId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [approvedPeriod, setApprovedPeriod] = useState(null);
  const [periodOptions, setPeriodOptions] = useState([]);
  const [selectedPeriodKey, setSelectedPeriodKey] = useState('');
  const [clientName, setClientName] = useState('');
  const [responsibleOptions, setResponsibleOptions] = useState([]);
  const stepDefinitions = [
    'Take input / format from Senior',
    'Train / transfer the information to the internal team (SC or FHH?)',
    'Prepare and review the relevant documents',
    'Checking to be done by Senior',
    'Conduct the training / auditing / discussion / time study, etc.',
    'Share the output (test score / photographs / auditing report / discussion MOM)',
    'Feedback / approval / agreement from relevant process owner / client owner',
  ];
  const stepPercentages = [10, 20, 50, 60, 70, 80, 100];

  const [deliverables, setDeliverables] = useState([]);
  const [contributorsByDeliverable, setContributorsByDeliverable] = useState({});
  const [startDatesByDeliverable, setStartDatesByDeliverable] = useState({});
  const [submittedRows, setSubmittedRows] = useState({});
  const [editingSubmittedRows, setEditingSubmittedRows] = useState({});
  const [rowSubmitLoading, setRowSubmitLoading] = useState({});
  const [monthStartWorkingDate, setMonthStartWorkingDate] = useState('');

  const [tableData, setTableData] = useState({});
  const [saveNonce, setSaveNonce] = useState(0);
  const [autosaveState, setAutosaveState] = useState('idle');
  const [autosaveError, setAutosaveError] = useState('');
  const [isBackendReady, setIsBackendReady] = useState(false);
  const [activePlanId, setActivePlanId] = useState(null);

  const tableDataRef = useRef({});
  const backendDeliverableMapRef = useRef({});
  const stepIdMapRef = useRef({});
  const pendingChangedKeysRef = useRef(new Set());
  const autosaveTimeoutRef = useRef(null);
  const savedMonthStartDateRef = useRef('');

  const getMemberDisplayName = (member) => {
    const name = member?.username || member?.full_name || member?.name || member?.first_name || '';
    if (name) return name;
    if (member?.email) return member.email.split('@')[0];
    return 'Unnamed';
  };

  const formatDateYYYYMMDD = (dateObj) => {
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const formatPeriodKey = (year, month) => `${year}-${String(month).padStart(2, '0')}`;

  const parsePeriodKey = (key) => {
    if (!key || typeof key !== 'string') return null;
    const match = key.match(/^(\d{4})-(\d{2})$/);
    if (!match) return null;

    const year = Number(match[1]);
    const month = Number(match[2]);
    if (!year || !month || month < 1 || month > 12) return null;

    return { year, month, key: formatPeriodKey(year, month) };
  };

  const getPreviousWorkingDateSkippingSunday = (dateStr) => {
    if (!dateStr) return '';

    const date = new Date(`${dateStr}T00:00:00`);
    if (Number.isNaN(date.getTime())) return '';

    date.setDate(date.getDate() - 1);
    while (date.getDay() === 0) {
      date.setDate(date.getDate() - 1);
    }

    return formatDateYYYYMMDD(date);
  };

  const getLastWorkingDayOfMonth = (year, monthIndex) => {
    const date = new Date(year, monthIndex + 1, 0);
    while (date.getDay() === 0 || date.getDay() === 6) {
      date.setDate(date.getDate() - 1);
    }
    return date;
  };

  const getMonthStartWorkingDateSkippingSunday = (year, monthIndex) => {
    const date = new Date(year, monthIndex, 1);
    while (date.getDay() === 0) {
      date.setDate(date.getDate() + 1);
    }
    return formatDateYYYYMMDD(date);
  };

  const getStepDatesFromPercentages = (step7DateStr, startWorkingDateStr) => {
    if (!step7DateStr || !startWorkingDateStr) return null;

    const step7Date = new Date(`${step7DateStr}T00:00:00`);
    const startDate = new Date(`${startWorkingDateStr}T00:00:00`);
    if (Number.isNaN(step7Date.getTime()) || Number.isNaN(startDate.getTime())) return null;

    const totalDaysBetween = Math.max(
      0,
      Math.round((step7Date.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
    );
    const prefillPercentages = stepPercentages.slice(0, 6);

    return prefillPercentages.map((percentage) => {
      const stepTargetDay = Math.ceil((percentage / 100) * totalDaysBetween);
      const computedDate = new Date(startDate);
      computedDate.setDate(computedDate.getDate() + stepTargetDay);

      return formatDateYYYYMMDD(computedDate);
    });
  };

  const getDeliverableStartDate = (deliverableId) => {
    return startDatesByDeliverable[deliverableId] || '';
  };

  const getArrayFromResponse = (data) => {
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.results)) return data.results;
    return [];
  };

  const parseResponsibleId = (value) => {
    if (!value || typeof value !== 'string' || !value.startsWith('id:')) return null;
    const raw = value.slice(3);
    return /^\d+$/.test(raw) ? Number(raw) : null;
  };

  const getSourceSignature = (sourceType, sourceId) => {
    const safeSourceType = sourceType || 'MANUAL';
    const safeSourceId = sourceId === null || sourceId === undefined ? '' : String(sourceId);
    return `${safeSourceType}:${safeSourceId}`;
  };

  const savePendingChanges = async () => {
    const changedKeys = Array.from(pendingChangedKeysRef.current);
    if (changedKeys.length === 0) return true;

    const uniqueStepTokens = new Set();
    const tokenToKeys = {};

    changedKeys.forEach((key) => {
      const match = key.match(/^(.*)-(\d+)-(owner|date)$/);
      if (!match) return;

      const deliverableId = match[1];
      const stepIndex = Number(match[2]);
      const token = `${deliverableId}-${stepIndex}`;
      uniqueStepTokens.add(token);

      if (!tokenToKeys[token]) tokenToKeys[token] = [];
      tokenToKeys[token].push(key);
    });

    if (uniqueStepTokens.size === 0) {
      pendingChangedKeysRef.current.clear();
      return true;
    }

    setAutosaveState('saving');
    setAutosaveError('');

    const failedTokens = [];

    for (const token of uniqueStepTokens) {
      try {
        const tokenMatch = token.match(/^(.*)-(\d+)$/);
        if (!tokenMatch) continue;

        const deliverableFrontendId = tokenMatch[1];
        const stepIndex = Number(tokenMatch[2]);
        const backendDeliverableId = backendDeliverableMapRef.current[deliverableFrontendId];

        if (!backendDeliverableId) {
          failedTokens.push(token);
          continue;
        }

        const stepNumber = stepIndex + 1;
        const ownerKey = `${deliverableFrontendId}-${stepIndex}-owner`;
        const dateKey = `${deliverableFrontendId}-${stepIndex}-date`;

        const payload = {
          deliverable: backendDeliverableId,
          step_number: stepNumber,
          responsible: parseResponsibleId(tableDataRef.current[ownerKey]),
          target_date: tableDataRef.current[dateKey] || null,
          remarks: '',
        };

        const stepLookupKey = `${backendDeliverableId}-${stepNumber}`;
        const existingStepId = stepIdMapRef.current[stepLookupKey];

        if (existingStepId) {
          await api.patch(DDFMS_ENDPOINTS.stepById(existingStepId), payload);
        } else {
          const createRes = await api.post(DDFMS_ENDPOINTS.steps, payload);
          const createdStepId = createRes?.data?.id;
          if (createdStepId) {
            stepIdMapRef.current[stepLookupKey] = createdStepId;
          }
        }

        const savedKeys = tokenToKeys[token] || [];
        savedKeys.forEach((savedKey) => pendingChangedKeysRef.current.delete(savedKey));
      } catch (error) {
        failedTokens.push(token);
      }
    }

    if (failedTokens.length > 0) {
      setAutosaveState('error');
      setAutosaveError('Auto-save failed for some changes. It will retry on your next edit.');
      return false;
    }

    setAutosaveState('saved');
    setAutosaveError('');
    return true;
  };

  const getMissingRequiredSteps = (deliverableId) => {
    const missingSteps = [];

    stepDefinitions.forEach((_, stepIndex) => {
      const ownerKey = `${deliverableId}-${stepIndex}-owner`;
      const dateKey = `${deliverableId}-${stepIndex}-date`;
      const hasOwner = Boolean(tableDataRef.current[ownerKey]);
      const hasDate = Boolean(tableDataRef.current[dateKey]);

      if (!hasOwner || !hasDate) {
        missingSteps.push(stepIndex + 1);
      }
    });

    return missingSteps;
  };

  const toggleSubmittedRowEditMode = (deliverableId) => {
    setEditingSubmittedRows((prev) => ({
      ...prev,
      [deliverableId]: !prev[deliverableId],
    }));
  };

  const handleSubmitDeliverableRow = async (deliverable) => {
    const backendDeliverableId = backendDeliverableMapRef.current[deliverable.id];
    if (!backendDeliverableId) {
      alert('Unable to submit this row right now. Please refresh and try again.');
      return;
    }

    const missingSteps = getMissingRequiredSteps(deliverable.id);
    if (missingSteps.length > 0) {
      alert(`Please complete Steps ${missingSteps.join(', ')} (owner + target date) before row submit.`);
      return;
    }

    const hasPendingRowChanges = Array.from(pendingChangedKeysRef.current).some((key) =>
      key.startsWith(`${deliverable.id}-`)
    );

    if (hasPendingRowChanges) {
      const saveOk = await savePendingChanges();
      if (!saveOk) {
        alert('Latest row changes could not be saved. Please retry submission.');
        return;
      }
    }

    setRowSubmitLoading((prev) => ({ ...prev, [deliverable.id]: true }));
    try {
      await api.patch(DDFMS_ENDPOINTS.deliverableById(backendDeliverableId), { is_submitted: true });
      setSubmittedRows((prev) => ({ ...prev, [deliverable.id]: true }));
      setEditingSubmittedRows((prev) => ({ ...prev, [deliverable.id]: false }));
      alert('Deliverable submitted. It is now visible in Task Management.');
    } catch (error) {
      const detail = error?.response?.data;
      if (detail?.is_submitted) {
        const message = Array.isArray(detail.is_submitted) ? detail.is_submitted.join(', ') : detail.is_submitted;
        alert(message);
      } else {
        alert('Failed to submit deliverable row.');
      }
    } finally {
      setRowSubmitLoading((prev) => ({ ...prev, [deliverable.id]: false }));
    }
  };

  useEffect(() => {
    const fetchApprovedDeliverables = async () => {
      if (!clientId) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setLoadError('');

      try {
        const token = localStorage.getItem('access_token');
        const headers = token ? { Authorization: `Bearer ${token}` } : {};

        const submissionsRes = await api.get(DDFMS_ENDPOINTS.submissions, {
          headers,
          params: { client_id: clientId },
        });
        const submissions = Array.isArray(submissionsRes.data)
          ? submissionsRes.data
          : (submissionsRes.data?.results || []);

        const approvedSubmissions = submissions.filter(
          (entry) => String(entry?.status || '').toUpperCase() === 'APPROVED'
        );

        if (approvedSubmissions.length === 0) {
          setPeriodOptions([]);
          const selectedFromKey = parsePeriodKey(selectedPeriodKey);
          const fallbackDate = selectedFromKey
            ? new Date(selectedFromKey.year, selectedFromKey.month - 1, 1)
            : new Date();
          const fallbackMonth = fallbackDate.getMonth() + 1;
          const fallbackYear = fallbackDate.getFullYear();
          const fallbackKey = formatPeriodKey(fallbackYear, fallbackMonth);

          if (!selectedFromKey) {
            setSelectedPeriodKey(fallbackKey);
          }

          setApprovedPeriod(null);
          setDeliverables([]);
          setMonthStartWorkingDate(getMonthStartWorkingDateSkippingSunday(fallbackYear, fallbackMonth - 1));
          setActivePlanId(null);
          setTableData({});
          setIsBackendReady(false);
          setStartDatesByDeliverable({});
          setSubmittedRows({});
          setEditingSubmittedRows({});
          setRowSubmitLoading({});
          backendDeliverableMapRef.current = {};
          stepIdMapRef.current = {};
          pendingChangedKeysRef.current.clear();
          return;
        }

        const sortedApproved = [...approvedSubmissions].sort((a, b) => {
          const yearDiff = Number(b?.year || 0) - Number(a?.year || 0);
          if (yearDiff !== 0) return yearDiff;

          const monthDiff = Number(b?.month || 0) - Number(a?.month || 0);
          if (monthDiff !== 0) return monthDiff;

          return Number(b?.id || 0) - Number(a?.id || 0);
        });

        const uniquePeriodsMap = new Map();
        sortedApproved.forEach((submission) => {
          const month = Number(submission?.month || 0);
          const year = Number(submission?.year || 0);
          if (!month || !year) return;

          const key = `${year}-${String(month).padStart(2, '0')}`;
          if (!uniquePeriodsMap.has(key)) {
            uniquePeriodsMap.set(key, {
              key,
              month,
              year,
              label: new Date(year, month - 1, 1).toLocaleString('default', {
                month: 'long',
                year: 'numeric',
              }),
            });
          }
        });

        const availablePeriods = Array.from(uniquePeriodsMap.values());
        setPeriodOptions(availablePeriods);

        const selectedFromKey = parsePeriodKey(selectedPeriodKey);
        const latestAvailablePeriod = availablePeriods[0] || null;
        const selectedPeriod = selectedFromKey || latestAvailablePeriod;

        if (!selectedFromKey && latestAvailablePeriod?.key && latestAvailablePeriod.key !== selectedPeriodKey) {
          setSelectedPeriodKey(latestAvailablePeriod.key);
        }

        const selectedMonth = selectedPeriod?.month;
        const selectedYear = selectedPeriod?.year;

        if (!selectedMonth || !selectedYear) {
          setApprovedPeriod(null);
          setDeliverables([]);
          setContributorsByDeliverable({});
          setResponsibleOptions([]);
          setStartDatesByDeliverable({});
          setSubmittedRows({});
          setEditingSubmittedRows({});
          setRowSubmitLoading({});
          return;
        }

        const hasApprovedForSelectedMonth = availablePeriods.some(
          (period) => Number(period.month) === Number(selectedMonth) && Number(period.year) === Number(selectedYear)
        );

        if (!hasApprovedForSelectedMonth) {
          setApprovedPeriod(null);
          setDeliverables([]);
          setContributorsByDeliverable({});
          setResponsibleOptions([]);
          setMonthStartWorkingDate(getMonthStartWorkingDateSkippingSunday(Number(selectedYear), Number(selectedMonth) - 1));
          setActivePlanId(null);
          setTableData({});
          setIsBackendReady(false);
          setStartDatesByDeliverable({});
          setSubmittedRows({});
          setEditingSubmittedRows({});
          setRowSubmitLoading({});
          backendDeliverableMapRef.current = {};
          stepIdMapRef.current = {};
          pendingChangedKeysRef.current.clear();
          return;
        }

        setApprovedPeriod({ month: selectedMonth, year: selectedYear });

        const [bigTasksRes, additionalTasksRes, entriesRes] = await Promise.all([
          api.get(DDFMS_ENDPOINTS.bigTasks, {
            headers,
            params: {
              client_id: clientId,
              month: selectedMonth,
              year: selectedYear,
            },
          }),
          api.get(DDFMS_ENDPOINTS.additionalTasks, {
            headers,
            params: {
              client_id: clientId,
              month: selectedMonth,
              year: selectedYear,
            },
          }),
          api.get(DDFMS_ENDPOINTS.manDayEntries, {
            headers,
            params: {
              client_id: clientId,
              month: selectedMonth,
              year: selectedYear,
            },
          }),
        ]);

        const role = (localStorage.getItem('role') || '').toUpperCase();

        const fetchProjectsData = async () => {
          try {
            if (role === 'EMPLOYEE') {
              const employeeProjectsRes = await api.get(DDFMS_ENDPOINTS.employeeProjects, { headers });
              const employeeProjects = Array.isArray(employeeProjectsRes.data)
                ? employeeProjectsRes.data
                : (employeeProjectsRes.data?.results || []);

              return employeeProjects.filter((project) => {
                const projectClientId = project?.client?.id
                  ?? project?.client_id
                  ?? project?.client;
                return String(projectClientId) === String(clientId);
              });
            }

            let projectsEndpoint = DDFMS_ENDPOINTS.projects;
            if (role === 'SGM') projectsEndpoint = DDFMS_ENDPOINTS.sgmProjects;

            const projectsRes = await api.get(projectsEndpoint, {
              headers,
              params: { client_id: clientId },
            });
            return Array.isArray(projectsRes.data)
              ? projectsRes.data
              : (projectsRes.data?.results || []);
          } catch (projectError) {
            console.warn('Failed to load projects for DDFMS context, continuing with defaults.', projectError);
            return [];
          }
        };

        const [projectsData, clientRes, employeesRes] = await Promise.all([
          fetchProjectsData(),
          api.get(DDFMS_ENDPOINTS.clientById(clientId), { headers }),
          api.get(DDFMS_ENDPOINTS.clientEmployees(clientId), { headers }),
        ]);

        const clientData = clientRes?.data || {};
        setClientName(clientData?.company_name || clientData?.name || '');
        const clientEmployees = Array.isArray(employeesRes.data)
          ? employeesRes.data
          : (employeesRes.data?.results || []);

        const entriesData = Array.isArray(entriesRes.data)
          ? entriesRes.data
          : (entriesRes.data?.results || []);

        const bigTasks = Array.isArray(bigTasksRes.data)
          ? bigTasksRes.data
          : (bigTasksRes.data?.results || []);
        const additionalTasks = Array.isArray(additionalTasksRes.data)
          ? additionalTasksRes.data
          : (additionalTasksRes.data?.results || []);

        const selectedMonthIndex = Number(selectedMonth) - 1;
        const selectedPeriodStart = new Date(Number(selectedYear), selectedMonthIndex, 1);
        const nextSelectedPeriodStart = new Date(Number(selectedYear), selectedMonthIndex + 1, 1);
        const selectedPeriodLastWorkingDate = getLastWorkingDayOfMonth(Number(selectedYear), selectedMonthIndex);
        const selectedPeriodLastWorkingDateStr = formatDateYYYYMMDD(selectedPeriodLastWorkingDate);

        const normalizeTask = (task, type, index) => {
          const rawDate = task?.target_date ? String(task.target_date).slice(0, 10) : '';
          const parsedDate = rawDate ? new Date(`${rawDate}T00:00:00`) : null;

          if (parsedDate && parsedDate < selectedPeriodStart) {
            return null;
          }

          let effectiveTargetDate = rawDate;
          if (parsedDate && parsedDate >= nextSelectedPeriodStart) {
            effectiveTargetDate = selectedPeriodLastWorkingDateStr;
          }

          if (!effectiveTargetDate) {
            effectiveTargetDate = selectedPeriodLastWorkingDateStr;
          }

          return {
            id: `${type}-${task?.id || index}`,
            title: task.title,
            startDate: '',
            targetDate: effectiveTargetDate,
            sourceType: type === 'big' ? 'BIG_TASK' : 'ADDITIONAL_TASK',
            sourceId: task?.id ?? null,
          };
        };

        const normalizedBigTasks = bigTasks
          .filter((task) => task?.title)
          .map((task, index) => normalizeTask(task, 'big', index))
          .filter(Boolean);

        const normalizedAdditionalTasks = additionalTasks
          .filter((task) => task?.title)
          .map((task, index) => normalizeTask(task, 'add', index))
          .filter(Boolean);

        const normalized = [...normalizedBigTasks, ...normalizedAdditionalTasks];

        const hierarchyRank = { HH: 1, SC: 2, SGM: 3 };
        const memberMap = new Map();
        const hierarchyByMemberGlobal = {};

        projectsData.forEach((project) => {
          if (!Array.isArray(project?.project_hierarchy)) return;
          project.project_hierarchy.forEach((item) => {
            if (!item?.hierarchy) return;

            const keys = [];
            if (item.member_id !== null && item.member_id !== undefined) {
              keys.push(`id:${String(item.member_id)}`);
            }
            if (item.member_key !== null && item.member_key !== undefined) {
              keys.push(`key:${String(item.member_key)}`);
            }

            keys.forEach((key) => {
              const existingHierarchy = hierarchyByMemberGlobal[key];
              if (!existingHierarchy || hierarchyRank[item.hierarchy] >= hierarchyRank[existingHierarchy]) {
                hierarchyByMemberGlobal[key] = item.hierarchy;
              }
            });
          });
        });

        const addOption = (value, label, hierarchy) => {
          const next = { value, label, hierarchy };
          const existing = memberMap.get(value);
          if (!existing || hierarchyRank[next.hierarchy] >= hierarchyRank[existing.hierarchy]) {
            memberMap.set(value, next);
          }
        };

        clientEmployees.forEach((employee, index) => {
          const memberId = employee?.user_id ?? employee?.id ?? employee?.employee_id;
          const memberKey = String(memberId ?? `employee-${index}`);
          const username = getMemberDisplayName(employee);
          const hierarchy = hierarchyByMemberGlobal[`id:${memberKey}`]
            || hierarchyByMemberGlobal[`key:${memberKey}`]
            || 'HH';
          addOption(`id:${memberKey}`, `${username} (${hierarchy})`, hierarchy);
        });

        const clientInternalTeam = Array.isArray(clientData?.internal_team_details)
          ? clientData.internal_team_details
          : [];

        clientInternalTeam.forEach((member, index) => {
          const memberId = member?.id;
          const memberKey = String(memberId ?? `internal-${index}`);
          const username = getMemberDisplayName(member);
          const hierarchy = hierarchyByMemberGlobal[`id:${memberKey}`]
            || hierarchyByMemberGlobal[`key:${memberKey}`]
            || 'HH';
          addOption(`id:${memberKey}`, `${username} (${hierarchy})`, hierarchy);
        });

        const clientSgms = Array.isArray(clientData?.assigned_sgms_details)
          ? clientData.assigned_sgms_details
          : [];

        clientSgms.forEach((sgm, index) => {
          const sgmId = sgm?.id;
          const sgmKey = String(sgmId ?? `sgm-${index}`);
          const username = getMemberDisplayName(sgm);
          addOption(`id:${sgmKey}`, `${username} (SGM)`, 'SGM');
        });

        projectsData.forEach((project) => {
          const hierarchyByMember = Array.isArray(project?.project_hierarchy)
            ? project.project_hierarchy.reduce((acc, item) => {
              if (!item) return acc;
              if (item.member_id !== null && item.member_id !== undefined) {
                acc[`id:${String(item.member_id)}`] = item.hierarchy;
              }
              if (item.member_key !== null && item.member_key !== undefined) {
                acc[`key:${String(item.member_key)}`] = item.hierarchy;
              }
              return acc;
            }, {})
            : {};

          const sgmDetail = project?.assigned_sgm_details
            || (project?.assigned_sgm_name || project?.assigned_sgm
              ? {
                id: project.assigned_sgm,
                username: project.assigned_sgm_name || 'Unnamed',
                full_name: project.assigned_sgm_name || 'Unnamed',
              }
              : null);

          if (sgmDetail) {
            const name = getMemberDisplayName(sgmDetail);
            const value = `id:${String(sgmDetail.id ?? `sgm-${name}`)}`;
            addOption(value, `${name} (SGM)`, 'SGM');
          }

          const internalTeam = Array.isArray(project?.team_members_details)
            ? project.team_members_details
            : (Array.isArray(project?.internal_team_details) ? project.internal_team_details : []);

          internalTeam.forEach((member, index) => {
            const name = getMemberDisplayName(member);
            const memberId = member?.id;
            const memberKey = String(memberId ?? `internal-${index}-${name}`);
            const hierarchy = hierarchyByMember[`id:${memberKey}`]
              || hierarchyByMember[`key:${memberKey}`]
              || hierarchyByMemberGlobal[`id:${memberKey}`]
              || hierarchyByMemberGlobal[`key:${memberKey}`]
              || 'HH';
            const value = `id:${memberKey}`;
            addOption(value, `${name} (${hierarchy})`, hierarchy);
          });
        });

        const responsibleMembers = Array.from(memberMap.values());
        setResponsibleOptions(responsibleMembers);

        const userIdByEmployeeId = new Map();
        clientEmployees.forEach((employee) => {
          const employeeId = employee?.employee_id ?? employee?.id;
          const userId = employee?.user_id;
          if (employeeId !== null && employeeId !== undefined && userId !== null && userId !== undefined) {
            userIdByEmployeeId.set(String(employeeId), String(userId));
          }
        });

        const contributorMap = {};
        entriesData.forEach((entry) => {
          const planHours = Number(entry?.plan_hours || 0);
          const offHours = Number(entry?.off_hours || 0);
          if (planHours + offHours <= 0) return;

          const taskKey = entry?.big_task
            ? `big-${entry.big_task}`
            : (entry?.additional_task ? `add-${entry.additional_task}` : null);
          if (!taskKey) return;

          const employeeId = entry?.employee_id ?? entry?.employee;
          const userId = userIdByEmployeeId.get(String(employeeId));
          if (!userId) return;

          if (!contributorMap[taskKey]) contributorMap[taskKey] = new Set();
          contributorMap[taskKey].add(`id:${userId}`);
        });

        const contributorMapAsArrays = {};
        Object.keys(contributorMap).forEach((taskKey) => {
          contributorMapAsArrays[taskKey] = Array.from(contributorMap[taskKey]);
        });

        setContributorsByDeliverable(contributorMapAsArrays);
        setDeliverables(normalized);
      } catch (error) {
        console.error('Failed to fetch approved DDTME deliverables for DDFMS', error);
        setLoadError('Failed to load approved DDTME data.');
        setApprovedPeriod(null);
        setPeriodOptions([]);
        setDeliverables([]);
        setContributorsByDeliverable({});
        setResponsibleOptions([]);
        setStartDatesByDeliverable({});
        setSubmittedRows({});
        setEditingSubmittedRows({});
        setRowSubmitLoading({});
      } finally {
        setLoading(false);
      }
    };

    fetchApprovedDeliverables();
  }, [clientId, selectedPeriodKey]);

  const updateCell = (key, value) => {
    const dateKeyMatch = key.match(/^(.*)-(\d+)-date$/);

    if (!dateKeyMatch) {
      pendingChangedKeysRef.current.add(key);
      setTableData((prev) => ({ ...prev, [key]: value }));
      setSaveNonce((prev) => prev + 1);
      return;
    }

    const deliverableId = dateKeyMatch[1];
    const stepIndex = Number(dateKeyMatch[2]);

    if (stepIndex === 6) {
      setTableData((prev) => {
        const next = { ...prev, [key]: value };
        pendingChangedKeysRef.current.add(key);

        const rowStartDate = getDeliverableStartDate(deliverableId);
        const computedStepDates = getStepDatesFromPercentages(value, rowStartDate);
        if (computedStepDates) {
          computedStepDates.forEach((computedDate, index) => {
            const computedDateKey = `${deliverableId}-${index}-date`;
            next[computedDateKey] = computedDate;
            pendingChangedKeysRef.current.add(computedDateKey);
          });
        }

        const step7DateKey = `${deliverableId}-6-date`;
        next[step7DateKey] = value;
        pendingChangedKeysRef.current.add(step7DateKey);

        return next;
      });

      setSaveNonce((prev) => prev + 1);
      return;
    }

    setTableData((prev) => {
      const next = { ...prev, [key]: value };
      pendingChangedKeysRef.current.add(key);

      let previousDate = value;
      for (let index = stepIndex - 1; index >= 0; index -= 1) {
        previousDate = getPreviousWorkingDateSkippingSunday(previousDate);
        const previousDateKey = `${deliverableId}-${index}-date`;
        next[previousDateKey] = previousDate;
        pendingChangedKeysRef.current.add(previousDateKey);
      }

      return next;
    });

    setSaveNonce((prev) => prev + 1);
  };

  const handleDeliverableStartDateChange = async (deliverableId, startDateValue) => {
    const normalizedStartDate = startDateValue || '';

    setStartDatesByDeliverable((prev) => ({
      ...prev,
      [deliverableId]: normalizedStartDate,
    }));

    const step7DateKey = `${deliverableId}-6-date`;
    const step7Date = tableDataRef.current[step7DateKey] || '';

    if (step7Date && normalizedStartDate) {
      setTableData((prev) => {
        const computedStepDates = getStepDatesFromPercentages(step7Date, normalizedStartDate);
        if (!computedStepDates) return prev;

        let changed = false;
        const next = { ...prev };

        computedStepDates.forEach((computedDate, index) => {
          const computedDateKey = `${deliverableId}-${index}-date`;
          if (next[computedDateKey] !== computedDate) {
            next[computedDateKey] = computedDate;
            pendingChangedKeysRef.current.add(computedDateKey);
            changed = true;
          }
        });

        if (changed) {
          setSaveNonce((nonce) => nonce + 1);
          return next;
        }

        return prev;
      });
    }

    const backendDeliverableId = backendDeliverableMapRef.current[deliverableId];
    if (!backendDeliverableId) return;

    try {
      await api.patch(DDFMS_ENDPOINTS.deliverableById(backendDeliverableId), {
        start_date: normalizedStartDate || null,
      });
    } catch (error) {
      console.error('Failed to save deliverable start date', error);
      alert('Failed to save start date. Please retry.');
    }
  };

  useEffect(() => {
    if (!approvedPeriod?.month || !approvedPeriod?.year) return;

    const year = Number(approvedPeriod.year);
    const monthIndex = Number(approvedPeriod.month) - 1;
    if (Number.isNaN(year) || Number.isNaN(monthIndex) || monthIndex < 0 || monthIndex > 11) return;

    setMonthStartWorkingDate(getMonthStartWorkingDateSkippingSunday(year, monthIndex));
    setIsBackendReady(false);
    setActivePlanId(null);
    setTableData({});
    backendDeliverableMapRef.current = {};
    stepIdMapRef.current = {};
    pendingChangedKeysRef.current.clear();
  }, [approvedPeriod]);

  useEffect(() => {
    tableDataRef.current = tableData;
  }, [tableData]);

  useEffect(() => {
    const initializeDdfmsData = async () => {
      if (!clientId || !approvedPeriod) {
        return;
      }

      try {
        setIsBackendReady(false);
        setAutosaveState('saving');
        setAutosaveError('');

        const plansRes = await api.get(DDFMS_ENDPOINTS.plans, {
          params: {
            client_id: clientId,
            month: approvedPeriod.month,
            year: approvedPeriod.year,
          },
        });
        const existingPlans = getArrayFromResponse(plansRes.data);

        const defaultMonthStartDate = getMonthStartWorkingDateSkippingSunday(
          Number(approvedPeriod.year),
          Number(approvedPeriod.month) - 1
        );

        let plan = existingPlans[0] || null;
        if (!plan) {
          const createPlanRes = await api.post(DDFMS_ENDPOINTS.plans, {
            client: Number(clientId),
            month: Number(approvedPeriod.month),
            year: Number(approvedPeriod.year),
            start_working_date: defaultMonthStartDate,
          });
          plan = createPlanRes.data;
        }

        const planId = plan?.id;
        if (!planId) {
          throw new Error('Unable to initialize DDFMS plan');
        }

        setActivePlanId(planId);

        const resolvedMonthStartDate = plan?.start_working_date
          ? String(plan.start_working_date).slice(0, 10)
          : defaultMonthStartDate;
        setMonthStartWorkingDate(resolvedMonthStartDate);
        savedMonthStartDateRef.current = resolvedMonthStartDate;

        const deliverablesRes = await api.get(DDFMS_ENDPOINTS.deliverables, {
          params: { plan_id: planId },
        });
        const backendDeliverables = getArrayFromResponse(deliverablesRes.data);

        const existingBySignature = backendDeliverables.reduce((acc, item) => {
          const signature = getSourceSignature(item?.source_type, item?.source_id);
          acc[signature] = item;
          return acc;
        }, {});

        const frontendToBackendMap = {};
        const frontendStartDateMap = {};
        const frontendSubmittedMap = {};

        for (let index = 0; index < deliverables.length; index += 1) {
          const deliverable = deliverables[index];
          const signature = getSourceSignature(deliverable.sourceType, deliverable.sourceId);
          let backendDeliverable = existingBySignature[signature];
          const rowStartDate = deliverable.startDate || null;

          if (!backendDeliverable) {
            const createDeliverableRes = await api.post(DDFMS_ENDPOINTS.deliverables, {
              plan: planId,
              source_type: deliverable.sourceType || 'MANUAL',
              source_id: deliverable.sourceId,
              title: deliverable.title,
              start_date: rowStartDate,
              target_date: deliverable.targetDate || null,
              order_index: index,
            });
            backendDeliverable = createDeliverableRes.data;
            existingBySignature[signature] = backendDeliverable;
          }

          if (backendDeliverable?.id) {
            frontendToBackendMap[deliverable.id] = backendDeliverable.id;
          }

          frontendStartDateMap[deliverable.id] = backendDeliverable?.start_date
            ? String(backendDeliverable.start_date).slice(0, 10)
            : (rowStartDate || '');

          frontendSubmittedMap[deliverable.id] = Boolean(backendDeliverable?.is_submitted);
        }

        backendDeliverableMapRef.current = frontendToBackendMap;
        setStartDatesByDeliverable(frontendStartDateMap);
        setSubmittedRows(frontendSubmittedMap);
        setEditingSubmittedRows({});
        setRowSubmitLoading({});

        const stepsRes = await api.get(DDFMS_ENDPOINTS.steps, {
          params: { plan_id: planId },
        });
        const backendSteps = getArrayFromResponse(stepsRes.data);
        const backendToFrontendMap = Object.entries(frontendToBackendMap).reduce((acc, [frontendId, backendId]) => {
          acc[String(backendId)] = frontendId;
          return acc;
        }, {});

        const loadedTableData = {};
        const loadedStepIdMap = {};

        backendSteps.forEach((step) => {
          const backendDeliverableId = step?.deliverable;
          const frontendDeliverableId = backendToFrontendMap[String(backendDeliverableId)];
          if (!frontendDeliverableId) return;

          const stepNumber = Number(step?.step_number || 0);
          if (stepNumber < 1 || stepNumber > 12) return;

          const stepIndex = stepNumber - 1;
          const ownerKey = `${frontendDeliverableId}-${stepIndex}-owner`;
          const dateKey = `${frontendDeliverableId}-${stepIndex}-date`;

          loadedTableData[ownerKey] = step?.responsible ? `id:${step.responsible}` : '';
          loadedTableData[dateKey] = step?.target_date ? String(step.target_date).slice(0, 10) : '';
          loadedStepIdMap[`${backendDeliverableId}-${stepNumber}`] = step?.id;
        });

        deliverables.forEach((deliverable) => {
          const taskTargetDate = deliverable?.targetDate ? String(deliverable.targetDate).slice(0, 10) : '';
          if (!taskTargetDate) return;

          const step7DateKey = `${deliverable.id}-6-date`;
          if (loadedTableData[step7DateKey] !== taskTargetDate) {
            loadedTableData[step7DateKey] = taskTargetDate;
            pendingChangedKeysRef.current.add(step7DateKey);
          }

          const rowStartDate = frontendStartDateMap[deliverable.id] || '';
          const computedStepDates = getStepDatesFromPercentages(taskTargetDate, rowStartDate);
          if (!computedStepDates) return;

          computedStepDates.forEach((computedDate, index) => {
            const computedDateKey = `${deliverable.id}-${index}-date`;
            if (loadedTableData[computedDateKey] !== computedDate) {
              loadedTableData[computedDateKey] = computedDate;
              pendingChangedKeysRef.current.add(computedDateKey);
            }
          });
        });

        stepIdMapRef.current = loadedStepIdMap;

        setTableData(loadedTableData);

        setIsBackendReady(true);
        setAutosaveState('saved');
      } catch (error) {
        console.error('Failed to initialize DDFMS autosave context', error);
        setActivePlanId(null);
        setIsBackendReady(false);
        setAutosaveState('error');
        setAutosaveError('Auto-save unavailable. Please refresh and try again.');
      }
    };

    initializeDdfmsData();
  }, [clientId, approvedPeriod, deliverables]);

  useEffect(() => {
    if (!activePlanId || !monthStartWorkingDate) return;
    if (savedMonthStartDateRef.current === monthStartWorkingDate) return;

    let isCancelled = false;

    const saveMonthStartDate = async () => {
      try {
        await api.patch(DDFMS_ENDPOINTS.planById(activePlanId), {
          start_working_date: monthStartWorkingDate,
        });

        if (!isCancelled) {
          savedMonthStartDateRef.current = monthStartWorkingDate;
        }
      } catch (error) {
        if (!isCancelled) {
          console.error('Failed to save DDFMS month start working date', error);
        }
      }
    };

    saveMonthStartDate();

    return () => {
      isCancelled = true;
    };
  }, [activePlanId, monthStartWorkingDate]);

  useEffect(() => {
    if (saveNonce <= 0) return;
    if (!isBackendReady) return;

    if (autosaveTimeoutRef.current) {
      clearTimeout(autosaveTimeoutRef.current);
    }

    autosaveTimeoutRef.current = setTimeout(() => {
      savePendingChanges();
    }, 600);

    return () => {
      if (autosaveTimeoutRef.current) {
        clearTimeout(autosaveTimeoutRef.current);
      }
    };
  }, [saveNonce, isBackendReady]);

  useEffect(() => {
    return () => {
      if (autosaveTimeoutRef.current) {
        clearTimeout(autosaveTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!isBackendReady) return;
    if (pendingChangedKeysRef.current.size === 0) return;
    setSaveNonce((prev) => prev + 1);
  }, [isBackendReady]);

  useEffect(() => {
    if (!Array.isArray(deliverables) || deliverables.length === 0) return;
    if (!Array.isArray(responsibleOptions) || responsibleOptions.length === 0) return;

    const hierarchyRank = { SGM: 3, SC: 2, HH: 1 };
    const sortedByHierarchy = [...responsibleOptions].sort((a, b) => {
      const rankA = hierarchyRank[String(a?.hierarchy || 'HH').toUpperCase()] || 0;
      const rankB = hierarchyRank[String(b?.hierarchy || 'HH').toUpperCase()] || 0;

      if (rankA !== rankB) return rankB - rankA;
      return String(a?.label || '').localeCompare(String(b?.label || ''));
    });

    const highestHierarchyMember = sortedByHierarchy[0];
    const lowestHierarchyMember = sortedByHierarchy[sortedByHierarchy.length - 1] || highestHierarchyMember;

    if (!highestHierarchyMember?.value || !lowestHierarchyMember?.value) return;

    const highHierarchySteps = new Set([1, 4]);

    setTableData((prev) => {
      const next = { ...prev };
      let changed = false;

      deliverables.forEach((deliverable) => {
        const contributors = Array.isArray(contributorsByDeliverable?.[deliverable.id])
          ? contributorsByDeliverable[deliverable.id]
          : [];

        const candidateMembers = contributors.length > 0
          ? responsibleOptions.filter((option) => contributors.includes(option.value))
          : responsibleOptions;

        const sortedCandidates = [...candidateMembers].sort((a, b) => {
          const rankA = hierarchyRank[String(a?.hierarchy || 'HH').toUpperCase()] || 0;
          const rankB = hierarchyRank[String(b?.hierarchy || 'HH').toUpperCase()] || 0;
          if (rankA !== rankB) return rankB - rankA;
          return String(a?.label || '').localeCompare(String(b?.label || ''));
        });

        const highestCandidate = sortedCandidates[0] || highestHierarchyMember;
        const lowestCandidate = sortedCandidates[sortedCandidates.length - 1] || lowestHierarchyMember;

        stepDefinitions.forEach((_, stepIndex) => {
          const ownerKey = `${deliverable.id}-${stepIndex}-owner`;
          if (!next[ownerKey]) {
            const stepNumber = stepIndex + 1;
            next[ownerKey] = highHierarchySteps.has(stepNumber)
              ? highestCandidate.value
              : lowestCandidate.value;
            pendingChangedKeysRef.current.add(ownerKey);
            changed = true;
          }
        });
      });

      if (changed) {
        setSaveNonce((nonce) => nonce + 1);
      }

      return changed ? next : prev;
    });
  }, [deliverables, responsibleOptions, contributorsByDeliverable, stepDefinitions]);

  const currentPeriodIndex = periodOptions.findIndex((period) => period.key === selectedPeriodKey);
  const parsedSelectedPeriod = parsePeriodKey(selectedPeriodKey);
  const fallbackDisplayPeriod = approvedPeriod
    ? {
      year: Number(approvedPeriod.year),
      month: Number(approvedPeriod.month),
    }
    : (periodOptions[0]
      ? { year: Number(periodOptions[0].year), month: Number(periodOptions[0].month) }
      : { year: new Date().getFullYear(), month: new Date().getMonth() + 1 });

  const displayYear = parsedSelectedPeriod?.year || fallbackDisplayPeriod.year;
  const displayMonth = parsedSelectedPeriod?.month || fallbackDisplayPeriod.month;
  const currentPeriodLabel = new Date(displayYear, displayMonth - 1, 1).toLocaleString('default', {
    month: 'long',
    year: 'numeric',
  });

  const canGoPrevMonth = true;
  const canGoNextMonth = true;

  const goToPrevMonth = () => {
    const prevDate = new Date(displayYear, displayMonth - 2, 1);
    setSelectedPeriodKey(formatPeriodKey(prevDate.getFullYear(), prevDate.getMonth() + 1));
  };

  const goToNextMonth = () => {
    const nextDate = new Date(displayYear, displayMonth, 1);
    setSelectedPeriodKey(formatPeriodKey(nextDate.getFullYear(), nextDate.getMonth() + 1));
  };

  return (
    <div className="h-screen w-screen bg-[#FBFBFB] antialiased font-sans flex overflow-hidden">
      <Sidebar />

      <main className="flex-1 overflow-y-auto transition-all duration-300 pb-20">
        <div className="max-w-[1600px] mx-auto px-6 pt-6 space-y-6">
          <button
            onClick={() => navigate('/ddfms')}
            className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-900 text-sm font-bold"
          >
            <ChevronLeft size={16} /> Back to DDFMS
          </button>

          <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
              <div className="flex flex-col gap-1 min-w-[210px]">
                <label className="text-[11px] font-black uppercase tracking-wider text-slate-500">Start Date (Working Day)</label>
                <input
                  type="date"
                  value={monthStartWorkingDate}
                  onChange={(e) => setMonthStartWorkingDate(e.target.value)}
                  className="px-2 py-1.5 bg-slate-50 border border-slate-200 rounded text-xs font-semibold text-slate-700 focus:outline-none"
                />
              </div>

              <div className="flex flex-col items-center text-center flex-1 min-w-[260px]">
                <div className="flex items-center justify-center gap-3">
                  <span className="p-2 rounded-lg bg-slate-100 text-slate-700">
                    <Box size={18} />
                  </span>
                  <h1 className="text-2xl font-black text-slate-900 tracking-tight">DDFMS Workspace</h1>
                </div>
                <p className="text-slate-600 text-sm font-bold mt-1">{clientName || `Client ${clientId}`}</p>
              </div>

              <div className="flex flex-col items-end gap-1 min-w-[210px]">
                <label className="text-[11px] font-black uppercase tracking-wider text-slate-500">Month</label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={goToPrevMonth}
                    disabled={!canGoPrevMonth}
                    className="p-1.5 rounded-full border border-slate-200 text-slate-700 disabled:opacity-40"
                  >
                    <ChevronLeft size={14} />
                  </button>
                  <span className="text-sm font-bold text-slate-800 min-w-[120px] text-center">{currentPeriodLabel}</span>
                  <button
                    type="button"
                    onClick={goToNextMonth}
                    disabled={!canGoNextMonth}
                    className="p-1.5 rounded-full border border-slate-200 text-slate-700 disabled:opacity-40"
                  >
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            </div>

            {!loading && !approvedPeriod && !loadError && (
              <p className="text-amber-700 text-sm mt-2 font-semibold">
                No approved DDTME submission found for selected month.
              </p>
            )}

            {loadError && (
              <p className="text-red-600 text-sm mt-2 font-semibold">{loadError}</p>
            )}

            {!loadError && (
              <p className="text-slate-500 text-xs mt-2 text-center font-semibold">
                {autosaveState === 'saving' && 'Autosaving changes...'}
                {autosaveState === 'saved' && isBackendReady && 'All changes are auto-saved.'}
                {autosaveState === 'error' && (autosaveError || 'Auto-save failed.')}
                {autosaveState === 'idle' && 'Autosave is preparing...'}
              </p>
            )}

            <div className="mt-6 border border-slate-200 rounded-xl overflow-x-auto">
              <table className="w-full min-w-[2600px] border-collapse">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-200">
                    <th className="sticky left-0 z-30 bg-slate-100 p-3 text-left text-xs font-black uppercase tracking-wider text-slate-700 border-r border-slate-200 min-w-[220px]">
                      Deliverable / Step
                    </th>
                    <th className="sticky left-[220px] z-30 bg-slate-100 p-3 text-center text-xs font-black uppercase tracking-wider text-slate-700 border-r border-slate-200 min-w-[160px]">
                      Start Date
                    </th>
                    <th className="sticky left-[380px] z-30 bg-slate-100 p-3 text-center text-xs font-black uppercase tracking-wider text-slate-700 border-r border-slate-200 min-w-[160px]">
                      Target Date
                    </th>
                    {stepDefinitions.map((stepText, index) => (
                      <th
                        key={`step-${index + 1}`}
                        colSpan={2}
                        className="p-3 text-center text-xs font-black uppercase tracking-wider text-slate-700 border-r border-slate-200 min-w-[180px]"
                      >
                        <div className="space-y-1 normal-case tracking-normal">
                          <div className="uppercase text-xs font-black tracking-wider">Step {index + 1}</div>
                          <div className="text-[13px] font-bold text-slate-600 leading-relaxed">{stepText}</div>
                        </div>
                      </th>
                    ))}
                    <th className="p-3 text-center text-xs font-black uppercase tracking-wider text-slate-700 min-w-[180px]">
                      Actions
                    </th>
                  </tr>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="sticky left-0 z-30 bg-slate-50 p-2 text-left text-[11px] font-bold text-slate-500 border-r border-slate-200">
                      Item
                    </th>
                    <th className="sticky left-[220px] z-30 bg-slate-50 p-2 text-center text-[11px] font-bold text-slate-500 border-r border-slate-200 min-w-[160px]">
                      Start Date
                    </th>
                    <th className="sticky left-[380px] z-30 bg-slate-50 p-2 text-center text-[11px] font-bold text-slate-500 border-r border-slate-200 min-w-[160px]">
                      Target Date
                    </th>
                    {stepDefinitions.map((_, index) => (
                      <React.Fragment key={`step-sub-${index + 1}`}>
                        <th className="p-2 text-center text-[11px] font-bold text-slate-500 border-r border-slate-200 min-w-[140px]">
                          Responsible Person
                        </th>
                        <th className="p-2 text-center text-[11px] font-bold text-slate-500 border-r border-slate-200 min-w-[140px]">
                          Target Date
                        </th>
                      </React.Fragment>
                    ))}
                    <th className="p-2 text-center text-[11px] font-bold text-slate-500 min-w-[180px]">
                      Row Action
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {deliverables.map((deliverable, rowIndex) => {
                    const isRowSubmitted = Boolean(submittedRows[deliverable.id]);
                    const isRowEditMode = Boolean(editingSubmittedRows[deliverable.id]);
                    const isRowLocked = isRowSubmitted && !isRowEditMode;
                    const isRowSubmitting = Boolean(rowSubmitLoading[deliverable.id]);
                    const rowBackgroundClass = isRowSubmitted ? 'bg-emerald-50/70' : 'bg-white';

                    return (
                      <tr key={deliverable.id} className={`${rowBackgroundClass} border-b border-slate-100`}>
                        <td className={`sticky left-0 z-20 ${rowBackgroundClass} p-2 border-r border-slate-200 align-top`}>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-black text-slate-500">{rowIndex + 1})</span>
                            <div className="w-full px-2 py-2 bg-slate-50 border border-slate-200 rounded text-sm font-semibold text-slate-800">
                              {deliverable.title}
                            </div>
                          </div>
                        </td>

                        <td className={`sticky left-[220px] z-20 ${rowBackgroundClass} p-2 border-r border-slate-200`}>
                          <input
                            type="date"
                            value={getDeliverableStartDate(deliverable.id)}
                            onChange={(e) => handleDeliverableStartDateChange(deliverable.id, e.target.value)}
                            disabled={isRowLocked}
                            className={`w-full px-2 py-2 bg-slate-50 border border-slate-200 rounded text-xs font-semibold text-slate-700 focus:outline-none ${isRowLocked ? 'opacity-70 cursor-not-allowed' : ''}`}
                          />
                        </td>

                        <td className={`sticky left-[380px] z-20 ${rowBackgroundClass} p-2 border-r border-slate-200`}>
                          <input
                            type="date"
                            value={deliverable.targetDate || ''}
                            readOnly
                            className="w-full px-2 py-2 bg-slate-50 border border-slate-200 rounded text-xs font-semibold text-slate-700 focus:outline-none"
                          />
                        </td>

                        {stepDefinitions.map((_, stepIndex) => {
                          const ownerKey = `${deliverable.id}-${stepIndex}-owner`;
                          const dateKey = `${deliverable.id}-${stepIndex}-date`;

                          return (
                            <React.Fragment key={`${deliverable.id}-${stepIndex}`}>
                              <td className="p-2 border-r border-slate-200">
                                <select
                                  value={tableData[ownerKey] || ''}
                                  onChange={(e) => updateCell(ownerKey, e.target.value)}
                                  disabled={isRowLocked}
                                  className={`w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded text-xs font-semibold text-slate-700 focus:outline-none ${isRowLocked ? 'opacity-70 cursor-not-allowed' : ''}`}
                                >
                                  <option value="">Select</option>
                                  {responsibleOptions.map((memberOption) => (
                                    <option key={memberOption.value} value={memberOption.value}>
                                      {memberOption.label}
                                    </option>
                                  ))}
                                </select>
                              </td>
                              <td className="p-2 border-r border-slate-200">
                                <input
                                  type="date"
                                  value={tableData[dateKey] || ''}
                                  onChange={(e) => updateCell(dateKey, e.target.value)}
                                  disabled={isRowLocked}
                                  className={`w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded text-xs font-semibold text-slate-700 focus:outline-none ${isRowLocked ? 'opacity-70 cursor-not-allowed' : ''}`}
                                />
                              </td>
                            </React.Fragment>
                          );
                        })}

                        <td className={`p-2 border-r border-slate-200 ${rowBackgroundClass}`}>
                          <div className="flex items-center justify-center gap-2">
                            {isRowSubmitted && (
                              <button
                                type="button"
                                onClick={() => toggleSubmittedRowEditMode(deliverable.id)}
                                className={`px-3 py-1.5 rounded text-[10px] font-black uppercase tracking-wider border ${isRowEditMode
                                  ? 'bg-slate-100 text-slate-700 border-slate-300'
                                  : 'bg-white text-slate-700 border-slate-300'}
                              `}
                              >
                                {isRowEditMode ? 'Cancel Edit' : 'Edit'}
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() => handleSubmitDeliverableRow(deliverable)}
                              disabled={isRowSubmitting || (isRowSubmitted && !isRowEditMode)}
                              className={`px-3 py-1.5 rounded text-[10px] font-black uppercase tracking-wider ${isRowSubmitting || (isRowSubmitted && !isRowEditMode)
                                ? 'bg-emerald-100 text-emerald-700 cursor-not-allowed'
                                : 'bg-emerald-600 text-white hover:bg-emerald-700'}
                            `}
                            >
                              {isRowSubmitting
                                ? 'Submitting...'
                                : (isRowSubmitted
                                  ? (isRowEditMode ? 'Re-Submit' : 'Submitted')
                                  : 'Submit')}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}

                  {!loading && deliverables.length === 0 && (
                    <tr>
                      <td
                        colSpan={4 + stepDefinitions.length * 2}
                        className="p-6 text-center text-sm font-semibold text-slate-500"
                      >
                        No deliverables available from approved DDTME.
                      </td>
                    </tr>
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

export default DDFMS;
