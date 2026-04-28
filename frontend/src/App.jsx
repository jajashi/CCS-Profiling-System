import { Routes, Route, Navigate, useParams, Outlet } from "react-router-dom";
import LoginPage from "./features/auth/routes/LoginPage";
import ChangePasswordPage from "./features/auth/routes/ChangePasswordPage";
import DashboardLayout from "./components/Layout/DashboardLayout";
import DashboardHome from "./features/dashboard/routes/DashboardHome";
import PlaceholderPage from "./features/misc/routes/PlaceholderPage";
import StudentInformation from "./features/students/routes/StudentInformation";
import FacultyInformation from "./features/faculty/routes/FacultyInformation";
import SpecializationManagement from "./features/faculty/routes/SpecializationManagement";
import AccountManagementPage from "./features/accounts/routes/AccountManagementPage";
import FacultyDashboard from "./features/faculty/routes/FacultyDashboard";
import CurriculaManagement from "./features/instruction/routes/CurriculaManagement";
import SyllabusListPage from "./features/instruction/routes/SyllabusListPage";
import SyllabusDetailPage from "./features/instruction/routes/SyllabusDetailPage";
import InstructionDashboard from "./features/instruction/routes/InstructionDashboard";
import LessonTracker from "./features/instruction/routes/LessonTracker";
import AdminSyllabiMonitor from "./features/instruction/routes/AdminSyllabiMonitor";
import RecentActivitiesPage from "./features/dashboard/routes/RecentActivitiesPage";
import TimeBlocksPage from "./features/scheduling/routes/TimeBlocksPage";
import RoomsPage from "./features/scheduling/routes/RoomsPage";
import SectionsPage from "./features/scheduling/routes/SectionsPage";
import MySchedulePage from "./features/scheduling/routes/MySchedulePage";
import SchedulingAnalyticsPage from "./features/scheduling/routes/SchedulingAnalyticsPage";
import SchedulingDashboard from "./features/scheduling/routes/SchedulingDashboard";
import EventCreationPage from "./features/events/routes/EventCreationPage";
import EventListPage from "./features/events/routes/EventListPage";
import EventApprovalPage from "./features/events/routes/EventApprovalPage";
import MyEventsPage from "./features/events/routes/MyEventsPage";
import StudentSchedulePage from "./features/scheduling/routes/StudentSchedulePage";
import FacultyMyClassesPage from "./features/faculty/routes/FacultyMyClassesPage";
import FacultyClassStudentsPage from "./features/faculty/routes/FacultyClassStudentsPage";
import FacultyClassOverviewPage from "./features/faculty/routes/FacultyClassOverviewPage";
import FacultyClassAttendancePage from "./features/faculty/routes/FacultyClassAttendancePage";
import FacultyPortalDashboardPage from "./features/faculty/routes/FacultyPortalDashboardPage";
import ReportsPage from './features/reports/routes/ReportsPage';
import StudentDossierPage from './features/reports/routes/StudentDossierPage';
import PasswordRequestPage from "./features/accounts/routes/PasswordRequestPage";
import ReferenceOptionManagement from "./features/accounts/routes/ReferenceOptionManagement";
import { useAuth } from "./providers/AuthContext";

import PublicRoute from "./components/guards/PublicRoute";
import {
  ProtectedRoute,
  PasswordReadyRoute,
  ForcePasswordChangeRoute,
  AdminRoute,
  NonStudentRoute,
  FacultyOnlyRoute,
  StudentDirectoryRoute,
  StudentProfileRoute,
  FacultyDirectoryRoute,
  FacultyProfileRoute,
  FacultyProfileIndexRedirect
} from "./components/guards/AuthGuard";

function DashboardIndex() {
  const { isFaculty } = useAuth();
  if (isFaculty) {
    return <Navigate to="/dashboard/faculty/dashboard" replace />;
  }
  return <DashboardHome />;
}

function App() {
  return (
    <Routes>
      <Route
        path="/"
        element={
          <PublicRoute>
            <LoginPage />
          </PublicRoute>
        }
      />
      <Route path="/change-password" element={<ForcePasswordChangeRoute />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <PasswordReadyRoute>
              <DashboardLayout />
            </PasswordReadyRoute>
          </ProtectedRoute>
        }>
        <Route index element={<DashboardIndex />} />
        <Route
          path="activities"
          element={<RecentActivitiesPage />}
        />
        <Route
          path="student-info"
          element={
            <StudentDirectoryRoute>
              <StudentInformation />
            </StudentDirectoryRoute>
          }
        />
        <Route
          path="student-info/:id"
          element={
            <StudentProfileRoute>
              <StudentInformation />
            </StudentProfileRoute>
          }
        />
        <Route
          path="student/schedule"
          element={
            <ProtectedRoute>
              <StudentSchedulePage />
            </ProtectedRoute>
          }
        />

        <Route
          path="faculty"
          element={
            <AdminRoute>
              <FacultyDashboard />
            </AdminRoute>
          }
        />
        <Route
          path="faculty/directory"
          element={
            <NonStudentRoute>
              <FacultyDirectoryRoute>
                <FacultyInformation />
              </FacultyDirectoryRoute>
            </NonStudentRoute>
          }
        />
        <Route
          path="faculty/directory/:employeeId"
          element={
            <NonStudentRoute>
              <FacultyProfileRoute>
                <FacultyInformation />
              </FacultyProfileRoute>
            </NonStudentRoute>
          }
        />
        <Route
          path="faculty/specializations"
          element={
            <AdminRoute>
              <SpecializationManagement />
            </AdminRoute>
          }
        />
          <Route
            path="accounts"
            element={
              <AdminRoute>
                <AccountManagementPage />
              </AdminRoute>
            }
          />
          <Route
            path="accounts/options"
            element={
              <AdminRoute>
                <ReferenceOptionManagement />
              </AdminRoute>
            }
          />
        <Route
          path="faculty/profile"
          element={<FacultyProfileIndexRedirect />}
        />
        <Route
          path="faculty/profile/:employeeId"
          element={
            <NonStudentRoute>
              <FacultyProfileRoute>
                <FacultyInformation />
              </FacultyProfileRoute>
            </NonStudentRoute>
          }
        />
        <Route
          path="faculty-info"
          element={
            <NonStudentRoute>
              <FacultyDirectoryRoute>
                <FacultyInformation />
              </FacultyDirectoryRoute>
            </NonStudentRoute>
          }
        />
        <Route
          path="faculty-info/:employeeId"
          element={
            <NonStudentRoute>
              <FacultyProfileRoute>
                <FacultyInformation />
              </FacultyProfileRoute>
            </NonStudentRoute>
          }
        />
        <Route
          path="faculty/dashboard"
          element={
            <FacultyOnlyRoute>
              <FacultyPortalDashboardPage />
            </FacultyOnlyRoute>
          }
        />
        <Route
          path="faculty/classes"
          element={
            <FacultyOnlyRoute>
              <FacultyMyClassesPage />
            </FacultyOnlyRoute>
          }
        />
        <Route
          path="faculty/classes/:sectionId"
          element={
            <FacultyOnlyRoute>
              <FacultyClassOverviewPage />
            </FacultyOnlyRoute>
          }
        />
        <Route
          path="faculty/classes/:sectionId/students"
          element={
            <FacultyOnlyRoute>
              <FacultyClassStudentsPage />
            </FacultyOnlyRoute>
          }
        />
        <Route
          path="faculty/classes/:sectionId/attendance"
          element={
            <FacultyOnlyRoute>
              <FacultyClassAttendancePage />
            </FacultyOnlyRoute>
          }
        />
        <Route
          path="reports"
          element={
            <NonStudentRoute>
              <ReportsPage />
            </NonStudentRoute>
          }
        />
        <Route
          path="reports/student/:id"
          element={
            <NonStudentRoute>
              <StudentDossierPage />
            </NonStudentRoute>
          }
        />
        <Route
          path="instruction"
          element={
            <NonStudentRoute>
              <InstructionDashboard />
            </NonStudentRoute>
          }
        />
        <Route
          path="instruction/curricula"
          element={
            <AdminRoute>
              <CurriculaManagement />
            </AdminRoute>
          }
        />
        <Route
          path="instruction/syllabi"
          element={
            <NonStudentRoute>
              <SyllabusListPage />
            </NonStudentRoute>
          }
        />
        <Route
          path="instruction/syllabi/:id"
          element={
            <NonStudentRoute>
              <SyllabusDetailPage />
            </NonStudentRoute>
          }
        />
        <Route
          path="instruction/tracking"
          element={
            <FacultyOnlyRoute>
              <LessonTracker />
            </FacultyOnlyRoute>
          }
        />
        <Route
          path="instruction/monitor"
          element={
            <AdminRoute>
              <AdminSyllabiMonitor />
            </AdminRoute>
          }
        />
        <Route
          path="scheduling"
          element={
            <NonStudentRoute>
              <Outlet />
            </NonStudentRoute>
          }>
          <Route index element={<TimeBlocksPage />} />
          <Route path="activity-log" element={<RecentActivitiesPage />} />
          <Route path="reports" element={<ReportsPage />} />
          <Route path="reports/dossier/:id" element={<StudentDossierPage />} />
          <Route path="faculty" element={<FacultyInformation />} />
          <Route path="rooms" element={<RoomsPage />} />
          <Route path="sections" element={<SectionsPage />} />
          <Route path="my-schedule" element={<MySchedulePage />} />
          <Route
            path="analytics"
            element={
              <AdminRoute>
                <SchedulingAnalyticsPage />
              </AdminRoute>
            }
          />
          <Route
            path="overview"
            element={
              <AdminRoute>
                <SchedulingDashboard />
              </AdminRoute>
            }
          />
        </Route>
        <Route
          path="events"
          element={
            <ProtectedRoute>
              <EventListPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="events/create"
          element={
            <AdminRoute>
              <EventCreationPage />
            </AdminRoute>
          }
        />
        <Route
          path="events/approval"
          element={
            <AdminRoute>
              <EventApprovalPage />
            </AdminRoute>
          }
        />
        <Route path="my-events" element={<MyEventsPage />} />
        <Route path="activities" element={<AdminRoute><RecentActivitiesPage /></AdminRoute>} />
        <Route path="security" element={<PasswordRequestPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
