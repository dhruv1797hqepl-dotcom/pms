import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';

import PrivateRoute from './components/PrivateRoute';
import { SidebarProvider } from './context/SidebarContext';

const HomePage = lazy(() => import('./pages/Home'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const ContactPage = lazy(() => import('./pages/ContactPage'));
const EmployeeProfile = lazy(() => import('./pages/profile/EmployeeProfile'));
const EmployeeDashboard = lazy(() => import('./pages/Dashboard/EmployeeDashboard'));
const RepeatableTaskPage = lazy(() => import("./pages/Dashboard/RepeatableTaskPage"));
const SGMProfile = lazy(() => import('./pages/profile/SGMProfile'));
const SeniorProfile = lazy(() => import('./pages/profile/SeniorProfile'));
const ClientManagement = lazy(() => import('./pages/ClientManagement'));
const ClientProjects = lazy(() => import('./pages/ClientProjects'));
const InternalTeamView = lazy(() => import('./pages/InternalTeamView'));
const ProjectDetails = lazy(() => import('./pages/ProjectDetails'));
const AdminProfile = lazy(() => import('./pages/profile/AdminProfile'));
const Createuser = lazy(() => import('./pages/createuser/Createuser'));
const ClientProfile = lazy(() => import('./pages/profile/ClientProfile'));
const HQEPLProfile = lazy(() => import('./pages/profile/HQEPLProfile'));
const StaffManagement = lazy(() => import('./pages/StaffManagement'));
const ActionPlanDashboard = lazy(() => import('./pages/ActionPlanDashboard'));
const WeeklyScore = lazy(() => import('./pages/WeeklyScore'));
const ExternalManagement = lazy(() => import('./pages/ExternalManagement'));
const MCTC = lazy(() => import('./pages/MCTC'));
const VisitAgenda = lazy(() => import('./pages/VisitAgenda'));
const VisitAgendaList = lazy(() => import('./pages/VisitAgendaList'));
const VisitAgendaLogs = lazy(() => import('./pages/VisitAgendaLogs'));
const VisitAgendaLogDetail = lazy(() => import('./pages/VisitAgendaLogDetail'));
const DDTMEBasePage = lazy(() => import('./pages/DDTME/DDTMEBasePage'));
const DDTMETable = lazy(() => import('./pages/DDTME/DDTMETable'));
const DDTMERYG = lazy(() => import('./pages/DDTME/DDTMERYG'));
const DDFMSBasePage = lazy(() => import('./pages/DDTME/DDFMSBasePage'));
const DDFMS = lazy(() => import('./pages/DDTME/DDFMS'));
const Achievement = lazy(() => import('./pages/Achievement/Achievement'));
const MandaysPlanning = lazy(() => import('./pages/MandaysPlanning'));
const CompanyLevelDashboard = lazy(() => import('./pages/Dashboard/CompanyLevelDashboard'));
const RC7 = lazy(() => import('./pages/RC7'));
const RC7Preview = lazy(() => import('./pages/RC7Preview'));

/**
 * Catch-all for unknown routes.
 * - Signed-in users  → redirected to their role dashboard.
 * - Signed-out users → redirected to /login (with the attempted path saved).
 */
const NotFound = () => {
  const location = useLocation();
  const token =
    localStorage.getItem('access_token') ||
    localStorage.getItem('token') ||
    localStorage.getItem('access');

  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // User is authenticated but hit an unknown URL — send to their home.
  const role = (localStorage.getItem('role') || '').toUpperCase();
  const roleHome = {
    ADMIN: '/admin',
    HQEPL: '/hqepl',
    MLS: '/mls',
    COO: '/coo',
    EMPLOYEE: '/employee',
    SGM: '/sgm',
    SENIOR: '/senior',
    CLIENT: '/client',
    EXTERNAL: '/employee',
  };
  return <Navigate to={roleHome[role] || '/'} replace />;
};

/* Helper: wraps a page element in PrivateRoute */
const P = (element) => <PrivateRoute>{element}</PrivateRoute>;

const App = () => {
  return (
    <SidebarProvider>
      <Router>
        <Suspense fallback={
          <div className="flex h-screen items-center justify-center bg-slate-50">
            <div className="flex flex-col items-center gap-4">
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600"></div>
              <p className="text-sm font-semibold tracking-widest text-slate-400 uppercase">Loading Space...</p>
            </div>
          </div>
        }>
          <Routes>
            {/* ── Public routes ─────────────────────────────────── */}
            <Route path="/"        element={<HomePage />} />
            <Route path="/login"   element={<LoginPage />} />
            <Route path="/contact" element={<ContactPage />} />

            {/* ── Admin ─────────────────────────────────────────── */}
            <Route path="/admin"              element={P(<AdminProfile />)} />
            <Route path="/admin/createuser"   element={P(<Createuser />)} />
            <Route path="/staff"              element={P(<StaffManagement />)} />

            {/* ── Employee / Dashboard ──────────────────────────── */}
            <Route path="/employee"                           element={P(<EmployeeProfile />)} />
            <Route path="/employeedashboard"                  element={P(<EmployeeDashboard />)} />
            <Route path="/employeedashboard/repeatable-task"  element={P(<RepeatableTaskPage />)} />

            {/* ── Profiles ──────────────────────────────────────── */}
            <Route path="/sgm"    element={P(<SGMProfile />)} />
            <Route path="/senior" element={P(<SeniorProfile />)} />
            <Route path="/client" element={P(<ClientProfile />)} />
            <Route path="/hqepl"  element={P(<HQEPLProfile />)} />
            <Route path="/mls"    element={P(<HQEPLProfile />)} />
            <Route path="/coo"    element={P(<HQEPLProfile />)} />

            {/* ── Clients & Projects ────────────────────────────── */}
            <Route path="/clients"                                   element={P(<ClientManagement />)} />
            <Route path="/clients/:clientId/"                        element={P(<ClientProjects />)} />
            <Route path="/clients/:clientId/internal-team"           element={P(<InternalTeamView />)} />
            <Route path="/clients/:clientId/external-management"     element={P(<ExternalManagement />)} />
            <Route path="/clients/:clientId/actionplan"              element={P(<ActionPlanDashboard />)} />
            <Route path="/projects/:projectId"                       element={P(<ProjectDetails />)} />

            {/* ── Company Dashboard ─────────────────────────────── */}
            <Route path="/company-dashboard" element={P(<CompanyLevelDashboard />)} />

            {/* ── DDTME / DDFMS ─────────────────────────────────── */}
            <Route path="/ddtme"                          element={P(<DDTMEBasePage />)} />
            <Route path="/ddtme/client/:clientId"         element={P(<DDTMETable />)} />
            <Route path="/ddtme/client/:clientId/ryg"     element={P(<DDTMERYG />)} />
            <Route path="/ddfms"                          element={P(<DDFMSBasePage />)} />
            <Route path="/ddfms/client/:clientId"         element={P(<DDFMS />)} />

            {/* ── Tools & Features ──────────────────────────────── */}
            <Route path="/weekly-score"       element={P(<WeeklyScore />)} />
            <Route path="/weeklyscore"        element={P(<WeeklyScore />)} />
            <Route path="/mctc"               element={P(<MCTC />)} />
            <Route path="/mandays-planning"   element={P(<MandaysPlanning />)} />
            <Route path="/achievement"        element={P(<Achievement />)} />
            <Route path="/rc7"                element={P(<RC7 />)} />
            <Route path="/rc7/preview"        element={P(<RC7Preview />)} />

            {/* ── Visit Agenda ──────────────────────────────────── */}
            <Route path="/visitagenda"                          element={P(<VisitAgendaList />)} />
            <Route path="/visitagenda/:clientId"                element={P(<VisitAgenda />)} />
            <Route path="/visitagenda/:clientId/logs"           element={P(<VisitAgendaLogs />)} />
            <Route path="/visitagenda/:clientId/logs/:logId"    element={P(<VisitAgendaLogDetail />)} />

            {/* ── Catch-all: unknown routes ──────────────────────── */}
            <Route path="*" element={<NotFound />} />

          </Routes>
        </Suspense>
      </Router>
    </SidebarProvider>
  );
};

export default App;