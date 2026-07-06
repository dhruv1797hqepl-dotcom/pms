# PMS (Project Management System) - API Documentation

## Base URLs

| Environment | URL |
|-------------|-----|
| **Production (Backend)** | `https://projectmanagement-1-3vmg.onrender.com` |
| **Production (Alternative)** | `https://projectmanagement-2-pync.onrender.com` |
| **Local Development** | `http://localhost:8000` (Django) / `http://localhost:5173` (Vite frontend) |

> The frontend uses **`VITE_API_BASE_URL`** env variable to set the base URL. In production, all API requests go to the Render domain. The frontend build is served by Django at the same origin, so in production the base URL can be empty (same-origin requests).

---

## Authentication

All API endpoints (except login/token refresh) require **JWT Bearer token** in the `Authorization` header.

| Header | Value |
|--------|-------|
| `Authorization` | `Bearer <access_token>` |

Token is stored in `localStorage` as `access_token`. Access token lifetime: **15 days**.

---

## API Endpoints

### 1. Authentication & Accounts (`/api/`)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/login/` | Login - obtain JWT tokens | No |
| POST | `/api/token/refresh/` | Refresh JWT access token | No |
| GET | `/api/me/` | Get current authenticated user details | Yes |
| GET | `/api/accounts/me/` | Get current user (alternative path) | Yes |
| POST | `/api/admin/create-user/` | Admin - create new user | Admin |
| GET | `/api/admin/users/` | Admin - list all users | Admin |
| GET | `/api/admin/users/?role=SGM` | Admin - filter users by role | Admin |
| GET | `/api/admin/users/?role=HQEPL` | Admin - filter by role | Admin |
| GET | `/api/admin/users/?role=MLS` | Admin - filter by role | Admin |
| GET | `/api/admin/users/?role=EMPLOYEE` | Admin - filter by role | Admin |
| GET | `/api/admin/users/<id>/` | Admin - get user details | Admin |
| PATCH | `/api/admin/users/<id>/` | Admin - update user | Admin |
| DELETE | `/api/admin/users/<id>/` | Admin - delete user | Admin |
| GET | `/api/assignable-users/?scope=internal` | List assignable internal users | Yes |
| GET | `/api/assignable-users/?scope=external_client` | List assignable external users | Yes |
| GET | `/api/hqepl/` | List HQEPL users | Yes |

---

### 2. Clients (`/api/clients/`)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/clients/create/` | Create a new client | Yes |
| GET | `/api/clients/list/` | List all clients | Yes |
| GET | `/api/clients/me/` | Get current user's client | Yes |
| GET | `/api/clients/senior-client/` | Get senior client info | Yes |
| GET | `/api/clients/<id>/` | Get client details | Yes |
| PATCH | `/api/clients/<id>/` | Update client | Yes |
| DELETE | `/api/clients/<id>/` | Delete client | Yes |
| GET | `/api/clients/<client_id>/members/` | List external team members | Yes |
| POST | `/api/clients/<client_id>/members/` | Create external team member | Yes |
| GET | `/api/clients/<client_id>/members/<member_id>/` | Get external member detail | Yes |
| PATCH | `/api/clients/<client_id>/members/<member_id>/` | Update external member | Yes |
| DELETE | `/api/clients/<client_id>/members/<member_id>/` | Delete external member | Yes |
| POST | `/api/clients/external-team/` | Create external team | Yes |
| GET | `/api/clients/<client_id>/projects/` | List client's projects | Yes |
| GET | `/api/clients/<client_id>/employees/` | List client's employees | Yes |
| GET | `/api/clients/<client_id>/action-tasks/` | List client's action tasks | Yes |
| GET | `/api/clients/<client_id>/external-team/` | List client's external team | Yes |

---

### 3. Projects (`/api/`)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/projects/` | List all projects | Yes |
| POST | `/api/projects/` | Create project | Yes |
| GET | `/api/projects/<id>/` | Get project details | Yes |
| PATCH | `/api/projects/<id>/` | Update project | Yes |
| DELETE | `/api/projects/<id>/` | Delete project | Yes |
| GET | `/api/projects/?client_id=<id>` | Filter projects by client | Yes |
| GET | `/api/projects/count/` | Get total project count | Yes |
| GET | `/api/projects/<id>/visit-agendas/` | Get visit agendas for a project | Yes |
| GET | `/api/projects/<project_id>/tasks/` | List action plan tasks for project | Yes |
| POST | `/api/projects/<project_id>/tasks/` | Create action plan task | Yes |
| GET | `/api/action-tasks/<task_id>/` | Get action task detail | Yes |
| PATCH | `/api/action-tasks/<task_id>/` | Update action task | Yes |
| GET | `/api/projects/<project_id>/action-plan/download/` | Download action plan as file | Yes |
| GET | `/api/projects/<project_id>/action-plan/download/<visit_agenda_id>/` | Download action plan for specific visit | Yes |

---

### 4. SGM (Senior General Manager) (`/api/sgm/`)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/sgm/projects/` | List SGM's assigned projects | SGM |
| GET | `/api/sgm/projects/<project_id>/` | Get project detail (SGM scope) | SGM |
| GET | `/api/sgm/employees/` | List employees (SGM scope) | SGM |
| POST | `/api/sgm/projects/<project_id>/assign-team/` | Assign team to project | SGM |
| GET | `/api/sgm/clients/` | List clients (SGM scope) | SGM |

---

### 5. Employees (`/api/employees/`)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/employees/my-projects/` | Get employee's projects | Employee |
| GET | `/api/employees/clients/` | List clients (employee scope) | Employee |
| GET | `/api/employees/clients/<client_id>/projects/` | Client's projects (employee) | Employee |
| GET | `/api/employees/external-clients/` | List external clients | External |
| GET | `/api/employees/external-projects/` | List external projects | External |
| GET | `/api/employees/projects/<project_id>/` | Get project detail (employee) | Employee |

---

### 6. Tasks (`/api/tasks/`)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/tasks/` | List all tasks (includes action plan tasks assigned to user) | Yes |
| POST | `/api/tasks/` | Create a new task | Yes |
| GET | `/api/tasks/<id>/` | Get task details | Yes |
| PATCH | `/api/tasks/<id>/` | Update task | Yes |
| DELETE | `/api/tasks/<id>/` | Delete task | Yes |
| GET | `/api/tasks/dashboard_stats/` | Get OTC/ATS dashboard statistics | Yes |
| GET | `/api/tasks/weekly-score-data/?month=&year=` | Get weekly score data | Yes |
| GET | `/api/tasks/company-dashboard-tasks/` | Get all employee/SGM tasks (admin/HQEPL/MLS) | Admin/HQEPL/MLS |
| POST | `/api/tasks/import_tasks_from_excel/` | Bulk import tasks from Excel file | Yes |
| GET | `/api/tasks/?is_repeatable=true` | Filter repeatable tasks | Yes |

**Task query params:** `client_org_id`, `project_id`, `assigned_to`, `status`, `is_repeatable`, `source_module`

---

### 7. DDTME (Daily Task & Man-day Entry) (`/api/ddtme/`)

#### Big Tasks
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/ddtme/big-tasks/` | List big tasks | Yes |
| POST | `/api/ddtme/big-tasks/` | Create big task | Yes |
| GET | `/api/ddtme/big-tasks/<id>/` | Get big task detail | Yes |
| PATCH | `/api/ddtme/big-tasks/<id>/` | Update big task | Yes |
| DELETE | `/api/ddtme/big-tasks/<id>/` | Delete big task | Yes |
| GET | `/api/ddtme/big-tasks/?client_id=&month=&year=` | Filter big tasks | Yes |

#### Submissions
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/ddtme/submissions/` | List submissions | Yes |
| POST | `/api/ddtme/submissions/submit/` | Submit DDTME for approval | Yes |
| POST | `/api/ddtme/submissions/<id>/approve/` | Approve submission (SGM) | Yes |
| POST | `/api/ddtme/submissions/<id>/reject/` | Reject submission | Yes |
| POST | `/api/ddtme/submissions/<id>/allow_edit/` | Allow editing (revert to Draft) | Yes |
| PATCH | `/api/ddtme/submissions/<id>/` | Update submission | Yes |
| GET | `/api/ddtme/submissions/?client_id=&month=&year=` | Filter submissions | Yes |

#### Additional Tasks
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/ddtme/additional-tasks/` | List additional tasks | Yes |
| POST | `/api/ddtme/additional-tasks/` | Create additional task | Yes |
| PATCH | `/api/ddtme/additional-tasks/<id>/` | Update additional task | Yes |
| DELETE | `/api/ddtme/additional-tasks/<id>/` | Delete additional task | Yes |
| POST | `/api/ddtme/additional-tasks/upload_excel_headers/` | Upload Excel - get column headers | Yes |
| POST | `/api/ddtme/additional-tasks/upload_excel_import/` | Upload Excel - import rows | Yes |
| GET | `/api/ddtme/additional-tasks/?client_id=&month=&year=` | Filter additional tasks | Yes |

#### Man-Day Entries
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/ddtme/man-day-entries/` | List man-day entries | Yes |
| POST | `/api/ddtme/man-day-entries/` | Create man-day entry | Yes |
| PATCH | `/api/ddtme/man-day-entries/<id>/` | Update man-day entry | Yes |
| DELETE | `/api/ddtme/man-day-entries/<id>/` | Delete man-day entry | Yes |
| GET | `/api/ddtme/man-day-entries/summary/` | Get mandays summary | Yes |
| POST | `/api/ddtme/man-day-entries/bulk_update_hours/` | Bulk update hours | Yes |
| GET | `/api/ddtme/man-day-entries/?client_id=&month=&year=&employee_id=&approved_only=` | Filter entries | Yes |

#### Monthly Objectives
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/ddtme/monthly-objectives/` | List monthly objectives | Yes |
| POST | `/api/ddtme/monthly-objectives/` | Create monthly objective | Yes |
| PATCH | `/api/ddtme/monthly-objectives/<id>/` | Update monthly objective | Yes |
| DELETE | `/api/ddtme/monthly-objectives/<id>/` | Delete monthly objective | Yes |
| GET | `/api/ddtme/monthly-objectives/?client_id=&month=&year=` | Filter objectives | Yes |

#### KPIs
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/ddtme/kpis/` | List KPIs | Yes |
| POST | `/api/ddtme/kpis/` | Create KPI | Yes |
| PATCH | `/api/ddtme/kpis/<id>/` | Update KPI | Yes |
| DELETE | `/api/ddtme/kpis/<id>/` | Delete KPI | Yes |
| GET | `/api/ddtme/kpis/?project_id=` | Filter KPIs by project | Yes |

#### KPI Updates
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/ddtme/kpi-updates/` | List KPI updates | Yes |
| POST | `/api/ddtme/kpi-updates/batch_update/` | Batch update KPI values | Yes |
| GET | `/api/ddtme/kpi-updates/?kpi_id=` | Filter updates by KPI | Yes |

---

### 8. DDFMS (Deliverable-based Framework) (`/api/ddfms/`)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/ddfms/plans/` | List plans | Yes |
| POST | `/api/ddfms/plans/` | Create plan | Yes |
| PATCH | `/api/ddfms/plans/<id>/` | Update plan | Yes |
| GET | `/api/ddfms/deliverables/` | List deliverables | Yes |
| POST | `/api/ddfms/deliverables/` | Create deliverable | Yes |
| PATCH | `/api/ddfms/deliverables/<id>/` | Update deliverable | Yes |
| GET | `/api/ddfms/steps/` | List steps | Yes |
| POST | `/api/ddfms/steps/` | Create step | Yes |
| PATCH | `/api/ddfms/steps/<id>/` | Update step | Yes |
| GET | `/api/ddfms/deliverables/?plan_id=` | Filter deliverables by plan | Yes |
| GET | `/api/ddfms/steps/?plan_id=` | Filter steps by plan | Yes |

---

### 9. MCTC (Man-Day Check-in Tracking) (`/api/mctc/`)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/mctc/entries/` | List MCTC entries | Yes |
| POST | `/api/mctc/entries/` | Create MCTC entry | Yes |
| PATCH | `/api/mctc/entries/<id>/` | Update MCTC entry | Yes |
| DELETE | `/api/mctc/entries/<id>/` | Delete MCTC entry | Yes |
| POST | `/api/mctc/entries/<id>/move/` | Move entry to new date/half | Yes |
| GET | `/api/mctc/entries/<id>/history/` | Get entry movement history | Yes |

---

### 10. RC7 (Resource & Capacity Planning) (`/api/rc7/`)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/rc7/planning/` | Get RC7 planning data | Yes |
| POST | `/api/rc7/planning/` | Create/update RC7 submission | Yes |

Query params: `client_id`, `month`, `year`, `employee_id`, `week`

---

### 11. Visit Agenda (`/api/visit-agenda/`)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/visit-agenda/` | List visit agendas | Yes |
| GET | `/api/visit-agenda/clients/<client_id>/` | Get/set visit agenda for client | Yes |
| PUT | `/api/visit-agenda/clients/<client_id>/` | Update visit agenda for client | Yes |
| POST | `/api/visit-agenda/clients/<client_id>/finalize/` | Finalize visit agenda (creates log) | Yes |
| GET | `/api/visit-agenda/clients/<client_id>/logs/` | Get visit agenda logs | Yes |
| GET | `/api/visit-agenda/clients/<client_id>/logs/<log_id>/` | Get specific log detail | Yes |
| GET | `/api/visit-agenda/clients/<client_id>/team/` | Get client team members | Yes |
| GET | `/api/visit-agenda/?client_id=` | Filter by client | Yes |

---

### 12. Achievement (`/api/achievement/`)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/achievement/achievements/` | List achievements | Yes |
| POST | `/api/achievement/achievements/` | Create achievement | Yes |
| PATCH | `/api/achievement/achievements/<id>/` | Update achievement (partial) | Yes |
| DELETE | `/api/achievement/achievements/<id>/` | Delete achievement | Yes |
| POST | `/api/achievement/achievements/<id>/toggle-token-shared/` | Toggle token shared status | Yes |

---

### 13. Notifications (`/api/notifications/`)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/notifications/` | List user's notifications | Yes |
| GET | `/api/notifications/<id>/` | Get notification detail | Yes |
| POST | `/api/notifications/<id>/mark-read/` | Mark notification as read | Yes |
| POST | `/api/notifications/mark-all-read/` | Mark all notifications as read | Yes |
| GET | `/api/notifications/unread-count/` | Get unread notification count | Yes |

---

### 14. Admin (`/admin/`)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/admin/` | Django Admin panel | Admin/Staff |

---

### 15. Media & Static Files

| Endpoint | Description |
|----------|-------------|
| `/media/<path>` | Serves uploaded media files (e.g., client logos) |
| `/static/<path>` | Serves static files |

---

## Frontend API Call Patterns

The frontend (`client/`) uses `api.js` which creates an **axios instance** with:

```js
baseURL: import.meta.env.VITE_API_BASE_URL || ""
```

The axios interceptor automatically:
- Prefixes non-absolute URLs with `/api/` if not already starting with `/api/`, `/media/`, or `/static/`
- Attaches `Authorization: Bearer <token>` header from `localStorage`
- On 401 response, clears tokens from localStorage

### Example frontend API calls:

```js
import api from '../api';

// Will automatically resolve to: VITE_API_BASE_URL + /api/tasks/
const tasks = await api.get('tasks/');

// Will automatically resolve to: VITE_API_BASE_URL + /api/projects/5/
const project = await api.get('projects/5/');

// Will automatically resolve to: VITE_API_BASE_URL + /api/clients/list/
const clients = await api.get('clients/list/');

// Already starts with /api/, used as-is
const me = await api.get('/me/');
const users = await api.get('/admin/users/');
```

---

## Environment Variables

### Client (`client/.env.production`)
```
VITE_API_BASE_URL=https://projectmanagement-1-3vmg.onrender.com
VITE_EMAILJS_PUBLIC_KEY=UQoNw5yM3Dshrd3Ng
VITE_EMAILJS_TEMPLATE_ID=service_qlunedf
VITE_EMAILJS_SERVICE_ID=service_oczgldo
```

### Server (`server/.env`)
```
SECRET_KEY=...
DEBUG=False
DATABASE_URL=postgres://...
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
```

---

## Data Models (Summary)

| App | Models |
|-----|--------|
| accounts | CustomUser (roles: ADMIN, HQEPL, MLS, SGM, EMPLOYEE, EXTERNAL, CLIENT) |
| clients | Client, ExternalTeam |
| projects | Project, ActionPlan, ActionTask, Flag, DocumentValue |
| employees | Employee |
| tasks | Task |
| ddtme | BigTask, DDTMESubmission, DDTMEAdditionalTask, ManDayEntry, DDTMEMonthlyObjective, KPI, KPIUpdate |
| ddfms | DDFMSPlan, DDFMSDeliverable, DDFMSStep |
| mctc | MCTCEntry, MCTCEntryHistory |
| rc7 | RC7Plan, RC7Submission |
| visit_agenda | VisitAgenda, VisitAgendaItem, VisitAgendaLog |
| achievement | Achievement |
| notifications | Notification |
