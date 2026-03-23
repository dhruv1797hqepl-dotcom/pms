import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, CalendarDays, CheckSquare, Plus } from "lucide-react";
import Sidebar from "../../components/Sidebar";
import api from "../../api";

const WEEK_DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

const MONTH_WEEKS = ["First", "Second", "Third", "Fourth", "Last"];

const normalizeListResponse = (payload) => (Array.isArray(payload) ? payload : payload?.results || []);

const normalizeRoleLabel = (role) => {
  const normalized = String(role || "").toUpperCase();
  if (normalized.includes("EXTERNAL")) return "(EXTERNAL)";
  return normalized || "EMPLOYEE";
};

const buildMemberFromUser = (user) => {
  if (!user) return null;
  return {
    ...user,
    id: user.id,
    username: user.username,
    full_name: user.full_name || `${user.first_name || ""} ${user.last_name || ""}`.trim(),
    email: user.email,
    role: normalizeRoleLabel(user.role),
  };
};

const dedupeMembersByIdentity = (members = []) => {
  const unique = new Map();

  members.forEach((member) => {
    if (!member) return;
    const emailKey = member.email ? `email:${String(member.email).toLowerCase()}` : "";
    const idKey = member.id ? `id:${member.id}` : "";
    const key = emailKey || idKey;
    if (!key || unique.has(key)) return;

    unique.set(key, {
      ...member,
      role: normalizeRoleLabel(member.role),
    });
  });

  return Array.from(unique.values());
};

const RepeatableTaskPage = () => {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [clientProjectMap, setClientProjectMap] = useState({});
  const [assignableDirectory, setAssignableDirectory] = useState({
    internal: [],
    externalClient: [],
  });

  const [formData, setFormData] = useState({
    task: "",
    client: "",
    project: "",
    assignedTo: "",
    isInternal: false,
    startDate: "",
    repeatFrequency: "",
    repeatEndDate: "",
    repeatDays: [],
    repeatWeeks: [],
    file: null,
  });

  const minTaskDate = useMemo(() => {
    const now = new Date();
    const offsetInMs = now.getTimezoneOffset() * 60 * 1000;
    return new Date(now.getTime() - offsetInMs).toISOString().split("T")[0];
  }, []);

  const getInternalDirectoryMembers = () => dedupeMembersByIdentity(assignableDirectory.internal);

  const getExternalClientUsers = (clientId = null) => {
    const normalizedClientId = Number(clientId);
    const hasValidClientId = Number.isInteger(normalizedClientId) && normalizedClientId > 0;

    const scopedDirectoryUsers = assignableDirectory.externalClient.filter((member) => {
      if (!hasValidClientId) return true;
      return Number(member.client_id) === normalizedClientId;
    });

    return dedupeMembersByIdentity(scopedDirectoryUsers);
  };

  const getAssignableMembers = () => {
    if (formData.isInternal) {
      return getInternalDirectoryMembers();
    }

    const selectedProject = clientProjectMap[formData.client]?.find((p) => p.name === formData.project);
    if (!selectedProject) {
      return getExternalClientUsers();
    }

    return getExternalClientUsers(selectedProject.client);
  };

  const toggleArrayValue = (arr, value) => (
    arr.includes(value) ? arr.filter((item) => item !== value) : [...arr, value]
  );

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [userRes, projectRes, internalUsersRes, externalUsersRes] = await Promise.all([
          api.get("me/"),
          api.get("projects/"),
          api.get("assignable-users/", { params: { scope: "internal" } }),
          api.get("assignable-users/", { params: { scope: "external_client" } }),
        ]);

        setCurrentUser(userRes.data || null);

        const projectsData = normalizeListResponse(projectRes.data);
        const mapping = {};
        projectsData.forEach((project) => {
          const client = project.client_name || "Unknown Client";
          if (!mapping[client]) mapping[client] = [];
          mapping[client].push(project);
        });
        setClientProjectMap(mapping);

        setAssignableDirectory({
          internal: normalizeListResponse(internalUsersRes.data).map(buildMemberFromUser).filter(Boolean),
          externalClient: normalizeListResponse(externalUsersRes.data).map(buildMemberFromUser).filter(Boolean),
        });

        setFormData((prev) => ({
          ...prev,
          startDate: prev.startDate || minTaskDate,
        }));
      } catch (error) {
        console.error("Failed to load repeatable task page:", error?.response?.data || error);
        alert("Unable to load data for repeatable task assignment.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [minTaskDate]);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!formData.repeatFrequency) {
      alert("Please select repeat frequency.");
      return;
    }

    if (!formData.repeatEndDate) {
      alert("Please select repeat end date.");
      return;
    }

    if (formData.repeatEndDate < minTaskDate) {
      alert("Repeat end date cannot be in the past.");
      return;
    }

    if (formData.repeatFrequency === "Weekly" && formData.repeatDays.length === 0) {
      alert("Select at least one day for weekly repetition.");
      return;
    }

    if (formData.repeatFrequency === "Monthly" && formData.repeatWeeks.length === 0) {
      alert("Select at least one week for monthly repetition.");
      return;
    }

    const selectedProjectObj = formData.isInternal
      ? null
      : clientProjectMap[formData.client]?.find((p) => p.name === formData.project);

    const selectedUser = getAssignableMembers().find((member) => member.email === formData.assignedTo);

    if ((!formData.isInternal && !selectedProjectObj) || !selectedUser) {
      alert("Please select valid project and team member.");
      return;
    }

    const payload = {
      title: formData.task,
      project: selectedProjectObj ? selectedProjectObj.id : null,
      client_org: selectedProjectObj ? selectedProjectObj.client : null,
      assigned_to: selectedUser.id,
      target_date: formData.startDate || minTaskDate,
      description: formData.isInternal ? "Internal Repeatable Task" : "Repeatable task via dashboard",
      status: "In Progress",
      is_repeatable: true,
      repeat_frequency: formData.repeatFrequency,
      repeat_end_date: formData.repeatEndDate,
      repeat_day: formData.repeatFrequency === "Weekly" ? formData.repeatDays.join(",") : null,
      repeat_week: formData.repeatFrequency === "Monthly" ? formData.repeatWeeks.join(",") : null,
    };

    try {
      if (formData.file) {
        const uploadData = new FormData();
        Object.keys(payload).forEach((key) => {
          if (payload[key] !== null && payload[key] !== "") {
            uploadData.append(key, payload[key]);
          }
        });
        uploadData.append("assigned_file", formData.file);
        await api.post("tasks/", uploadData, { headers: { "Content-Type": "multipart/form-data" } });
      } else {
        await api.post("tasks/", payload);
      }

      alert("Repeatable task created successfully.");
      navigate("/employeedashboard");
    } catch (error) {
      console.error("Failed to create repeatable task:", error?.response?.data || error);
      alert(`Failed to create repeatable task: ${JSON.stringify(error?.response?.data || error?.message)}`);
    }
  };

  const displayName = currentUser?.full_name || currentUser?.username || "Employee";

  return (
    <div className="h-screen w-screen bg-slate-50 relative flex overflow-hidden">
      <Sidebar />

      <main className="flex-1 overflow-y-auto pb-20">
        <div className="max-w-4xl mx-auto mt-5 px-4 md:px-6">
          <div className="bg-slate-900 rounded-2xl px-5 md:px-6 py-4 flex items-center justify-between text-white shadow-xl">
            <button
              type="button"
              onClick={() => navigate("/employeedashboard")}
              className="flex items-center gap-2 text-slate-300 hover:text-white transition-colors"
            >
              <ArrowLeft size={18} />
              <span className="text-xs font-semibold">Back</span>
            </button>
            <h1 className="text-sm md:text-lg font-extrabold text-[#F58A4B] text-center">{displayName} - Repeatable Task</h1>
            <div className="w-[64px]" />
          </div>

          <div className="bg-white border border-slate-200 rounded-3xl shadow-sm mt-6 overflow-hidden">
            <div className="px-6 md:px-8 py-5 border-b border-slate-100">
              <h2 className="text-sm font-black uppercase tracking-widest text-slate-800 flex items-center gap-2">
                <CalendarDays size={16} className="text-[#F58A4B]" /> Configure Repeat Task
              </h2>
              <p className="text-xs text-slate-500 mt-2">
                Choose Daily, Weekly, or Monthly repetition and set the end date.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                <div className="col-span-1 md:col-span-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Task Name</label>
                  <input
                    required
                    value={formData.task}
                    onChange={(e) => setFormData({ ...formData, task: e.target.value })}
                    className="w-full mt-1 bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3 text-sm outline-none focus:ring-2 ring-emerald-400 transition-all font-bold text-slate-700"
                    placeholder="Enter repeatable task name"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Client</label>
                  <select
                    required
                    value={formData.isInternal ? "Internal" : formData.client}
                    onChange={(e) => {
                      if (e.target.value === "Internal") {
                        setFormData({
                          ...formData,
                          client: "",
                          project: "",
                          assignedTo: "",
                          isInternal: true,
                        });
                        return;
                      }

                      setFormData({
                        ...formData,
                        client: e.target.value,
                        project: "",
                        assignedTo: "",
                        isInternal: false,
                      });
                    }}
                    className="w-full mt-1 bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3 text-sm outline-none focus:ring-2 ring-emerald-400 transition-all font-bold text-slate-700"
                    disabled={loading}
                  >
                    <option value="">Select Client</option>
                    <option value="Internal">Internal</option>
                    {Object.keys(clientProjectMap).map((clientName) => (
                      <option key={clientName} value={clientName}>{clientName}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Project</label>
                  <select
                    required={!formData.isInternal}
                    value={formData.project}
                    onChange={(e) => setFormData({ ...formData, project: e.target.value, assignedTo: "" })}
                    className="w-full mt-1 bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3 text-sm outline-none focus:ring-2 ring-emerald-400 transition-all font-bold text-slate-700"
                    disabled={loading || formData.isInternal || !formData.client}
                  >
                    <option value="">{formData.isInternal ? "N/A" : "Select Project"}</option>
                    {!formData.isInternal && formData.client && clientProjectMap[formData.client]?.map((project) => (
                      <option key={project.id} value={project.name}>{project.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Assigned To</label>
                  <select
                    required
                    value={formData.assignedTo}
                    onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}
                    className="w-full mt-1 bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3 text-sm outline-none focus:ring-2 ring-emerald-400 transition-all font-bold text-slate-700"
                    disabled={loading || (!formData.isInternal && !formData.project)}
                  >
                    <option value="">Select Team Member</option>
                    {getAssignableMembers().map((member) => (
                      <option key={member.id || member.email} value={member.email}>
                        {member.full_name || member.username || member.email} ({member.role})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Start Date</label>
                  <input
                    required
                    type="date"
                    value={formData.startDate}
                    min={minTaskDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full mt-1 bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3 text-sm outline-none focus:ring-2 ring-emerald-400 transition-all font-bold text-slate-700"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Repeat Frequency</label>
                  <select
                    required
                    value={formData.repeatFrequency}
                    onChange={(e) => setFormData({ ...formData, repeatFrequency: e.target.value, repeatDays: [], repeatWeeks: [] })}
                    className="w-full mt-1 bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3 text-sm outline-none focus:ring-2 ring-emerald-400 transition-all font-bold text-slate-700"
                  >
                    <option value="">Select Frequency</option>
                    <option value="Daily">Daily</option>
                    <option value="Weekly">Weekly</option>
                    <option value="Monthly">Monthly</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Repeat End Date</label>
                  <input
                    required
                    type="date"
                    value={formData.repeatEndDate}
                    min={minTaskDate}
                    onChange={(e) => setFormData({ ...formData, repeatEndDate: e.target.value })}
                    className="w-full mt-1 bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3 text-sm outline-none focus:ring-2 ring-emerald-400 transition-all font-bold text-slate-700"
                  />
                </div>

                {formData.repeatFrequency === "Weekly" && (
                  <div className="col-span-1 md:col-span-2 bg-slate-50 rounded-2xl border border-dashed border-slate-300 px-4 py-4">
                    <p className="text-[10px] font-black uppercase text-slate-500 tracking-wider mb-3 flex items-center gap-2">
                      <CheckSquare size={12} /> Select Weekly Days
                    </p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {WEEK_DAYS.map((day) => (
                        <label key={day} className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formData.repeatDays.includes(day)}
                            onChange={() => setFormData({ ...formData, repeatDays: toggleArrayValue(formData.repeatDays, day) })}
                            className="accent-slate-900"
                          />
                          {day}
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {formData.repeatFrequency === "Monthly" && (
                  <div className="col-span-1 md:col-span-2 bg-slate-50 rounded-2xl border border-dashed border-slate-300 px-4 py-4">
                    <p className="text-[10px] font-black uppercase text-slate-500 tracking-wider mb-3 flex items-center gap-2">
                      <CheckSquare size={12} /> Select Monthly Weeks
                    </p>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                      {MONTH_WEEKS.map((week) => (
                        <label key={week} className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formData.repeatWeeks.includes(week)}
                            onChange={() => setFormData({ ...formData, repeatWeeks: toggleArrayValue(formData.repeatWeeks, week) })}
                            className="accent-slate-900"
                          />
                          {week}
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                <div className="col-span-1 md:col-span-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Attachment (Optional)</label>
                  <input
                    type="file"
                    onChange={(e) => setFormData({ ...formData, file: e.target.files?.[0] || null })}
                    className="w-full mt-1 bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3 text-xs font-bold outline-none focus:ring-2 ring-emerald-400 transition-all text-slate-700"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full bg-slate-900 text-white font-black py-4 rounded-3xl text-sm uppercase tracking-widest shadow-xl shadow-slate-200 hover:bg-black transition-all active:scale-95 flex justify-center gap-2 items-center"
                  disabled={loading}
                >
                  <Plus size={18} /> Create Repeatable Task
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
};

export default RepeatableTaskPage;
