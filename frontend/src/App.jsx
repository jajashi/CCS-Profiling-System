import { Routes, Route, Navigate, useParams, Outlet } from 'react-router-dom';
import LoginPage from './features/auth/routes/LoginPage';
import ChangePasswordPage from './features/auth/routes/ChangePasswordPage';
import DashboardLayout from './components/Layout/DashboardLayout';
import DashboardHome from './features/dashboard/routes/DashboardHome';
import PlaceholderPage from './features/misc/routes/PlaceholderPage';
import StudentInformation from './features/students/routes/StudentInformation';
import FacultyInformation from './features/faculty/routes/FacultyInformation';
import SpecializationManagement from './features/faculty/routes/SpecializationManagement';
import AccountManagementPage from './features/accounts/routes/AccountManagementPage';
import FacultyDashboard from './features/faculty/routes/FacultyDashboard';
import CurriculaManagement from './features/instruction/routes/CurriculaManagement';
import SyllabusListPage from './features/instruction/routes/SyllabusListPage';
import SyllabusDetailPage from './features/instruction/routes/SyllabusDetailPage';
import InstructionDashboard from './features/instruction/routes/InstructionDashboard';
import TimeBlocksPage from './features/scheduling/routes/TimeBlocksPage';
import RoomsPage from './features/scheduling/routes/RoomsPage';
import SectionsPage from './features/scheduling/routes/SectionsPage';
import MySchedulePage from './features/scheduling/routes/MySchedulePage';
import SchedulingDashboard from './features/scheduling/routes/SchedulingDashboard';
import EventCreationPage from './features/events/routes/EventCreationPage';
import EventListPage from './features/events/routes/EventListPage';
import EventApprovalPage from './features/events/routes/EventApprovalPage';
import MyEventsPage from './features/events/routes/MyEventsPage';
import GlobalCalendarPage from './features/events/routes/GlobalCalendarPage';
import StudentSchedulePage from './features/scheduling/routes/StudentSchedulePage';
import FacultyMyClassesPage from './features/faculty/routes/FacultyMyClassesPage';
import FacultyClassStudentsPage from './features/faculty/routes/FacultyClassStudentsPage';
import FacultyClassOverviewPage from './features/faculty/routes/FacultyClassOverviewPage';
import FacultyClassAttendancePage from './features/faculty/routes/FacultyClassAttendancePage';
import FacultyPortalDashboardPage from './features/faculty/routes/FacultyPortalDashboardPage';
import { useAuth } from './providers/AuthContext';

// Protected Route Wrapper
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }
  return children;
};

const PasswordReadyRoute = ({ children }) => {
  const { isAuthenticated, mustChangePassword } = useAuth();
  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }
  if (mustChangePassword) {
    return <Navigate to="/change-password" replace />;
  }
  return children;
};

const ForcePasswordChangeRoute = () => {
  const { isAuthenticated, mustChangePassword } = useAuth();
  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }
  if (!mustChangePassword) {
    return <Navigate to="/dashboard" replace />;
  }
  return <ChangePasswordPage />;
};

const AdminRoute = ({ children }) => {
  const { isAuthenticated, isAdmin } = useAuth();
  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }
  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
};

const NonStudentRoute = ({ children }) => {
  const { isAuthenticated, isStudent } = useAuth();
  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }
  if (isStudent) {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
};

/** Faculty-only pages (e.g. class management); admins use other scheduling tools. */
const FacultyOnlyRoute = ({ children }) => {
  const { isAuthenticated, isFaculty, isStudent } = useAuth();
  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }
  if (isStudent) {
    return <Navigate to="/dashboard" replace />;
  }
  if (!isFaculty) {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
};

/** Students may not use the full directory index; send them to their profile. */
const StudentDirectoryRoute = ({ children }) => {
  const { isAuthenticated, isStudent, user } = useAuth();
  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }
  if (isStudent && user?.studentId) {
    return <Navigate to={`/dashboard/student-info/${user.studentId}`} replace />;
  }
  return children;
};

/** Students may only open their own profile URL. */
const StudentProfileRoute = ({ children }) => {
  const { id } = useParams();
  const { isAuthenticated, isStudent, user } = useAuth();
  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }
  if (isStudent && user?.studentId && String(id) !== String(user.studentId)) {
    return <Navigate to={`/dashboard/student-info/${user.studentId}`} replace />;
  }
  return children;
};

/** Faculty may not browse the full directory index; open their own profile. */
const FacultyDirectoryRoute = ({ children }) => {
  const { isAuthenticated, isFaculty, user } = useAuth();
  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }
  if (isFaculty && user?.employeeId) {
    return (
      <Navigate
        to={`/dashboard/faculty/directory/${encodeURIComponent(user.employeeId)}`}
        replace
      />
    );
  }
  return children;
};

/** Faculty may only open their own faculty profile URL. */
const FacultyProfileRoute = ({ children }) => {
  const { employeeId } = useParams();
  const { isAuthenticated, isFaculty, user } = useAuth();
  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }
  if (
    isFaculty &&
    user?.employeeId &&
    String(employeeId || '').toLowerCase() !== String(user.employeeId).toLowerCase()
  ) {
    return (
      <Navigate
        to={`/dashboard/faculty/directory/${encodeURIComponent(user.employeeId)}`}
        replace
      />
    );
  }
  return children;
};

/** Legacy /faculty/profile → own directory URL for faculty, or full directory for admin. */
const FacultyProfileIndexRedirect = () => {
  const { isFaculty, user } = useAuth();
  if (isFaculty && user?.employeeId) {
    return (
      <Navigate
        to={`/dashboard/faculty/directory/${encodeURIComponent(user.employeeId)}`}
        replace
      />
    );
  }
  return <Navigate to="/dashboard/faculty/directory" replace />;
};

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
      <Route path="/" element={<LoginPage />} />
      <Route path="/change-password" element={<ForcePasswordChangeRoute />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <PasswordReadyRoute>
              <DashboardLayout />
            </PasswordReadyRoute>
          </ProtectedRoute>
        }
      >
        <Route index element={<DashboardIndex />} />
        <Route path="student-info" element={<StudentDirectoryRoute><StudentInformation /></StudentDirectoryRoute>} />
        <Route path="student-info/:id" element={<StudentProfileRoute><StudentInformation /></StudentProfileRoute>} />
        <Route path="student/schedule" element={<ProtectedRoute><StudentSchedulePage /></ProtectedRoute>} />
        
        <Route
          path="faculty"
          element={(
            <AdminRoute>
              <FacultyDashboard />
            </AdminRoute>
          )}
        />
        <Route
          path="faculty/directory"
          element={(
            <NonStudentRoute>
              <FacultyDirectoryRoute>
                <FacultyInformation />
              </FacultyDirectoryRoute>
            </NonStudentRoute>
          )}
        />
        <Route
          path="faculty/directory/:employeeId"
          element={(
            <NonStudentRoute>
              <FacultyProfileRoute>
                <FacultyInformation />
              </FacultyProfileRoute>
            </NonStudentRoute>
          )}
        />
        <Route
          path="faculty/specializations"
          element={(
            <AdminRoute>
              <SpecializationManagement />
            </AdminRoute>
          )}
        />
        <Route
          path="accounts"
          element={(
            <AdminRoute>
              <AccountManagementPage />
            </AdminRoute>
          )}
        />
        <Route path="faculty/profile" element={<FacultyProfileIndexRedirect />} />
        <Route
          path="faculty/profile/:employeeId"
          element={(
            <NonStudentRoute>
              <FacultyProfileRoute>
                <FacultyInformation />
              </FacultyProfileRoute>
            </NonStudentRoute>
          )}
        />
        <Route
          path="faculty-info"
          element={(
            <NonStudentRoute>
              <FacultyDirectoryRoute>
                <FacultyInformation />
              </FacultyDirectoryRoute>
            </NonStudentRoute>
          )}
        />
        <Route
          path="faculty-info/:employeeId"
          element={(
            <NonStudentRoute>
              <FacultyProfileRoute>
                <FacultyInformation />
              </FacultyProfileRoute>
            </NonStudentRoute>
          )}
        />
        <Route
          path="faculty/dashboard"
          element={(
            <FacultyOnlyRoute>
              <FacultyPortalDashboardPage />
            </FacultyOnlyRoute>
          )}
        />
        <Route
          path="faculty/classes"
          element={(
            <FacultyOnlyRoute>
              <FacultyMyClassesPage />
            </FacultyOnlyRoute>
          )}
        />
        <Route
          path="faculty/classes/:sectionId"
          element={(
            <FacultyOnlyRoute>
              <FacultyClassOverviewPage />
            </FacultyOnlyRoute>
          )}
        />
        <Route
          path="faculty/classes/:sectionId/students"
          element={(
            <FacultyOnlyRoute>
              <FacultyClassStudentsPage />
            </FacultyOnlyRoute>
          )}
        />
        <Route
          path="faculty/classes/:sectionId/attendance"
          element={(
            <FacultyOnlyRoute>
              <FacultyClassAttendancePage />
            </FacultyOnlyRoute>
          )}
        />
        <Route
          path="reports"
          element={(
            <AdminRoute>
              <PlaceholderPage title="Reports" />
            </AdminRoute>
          )}
        />
        <Route path="instruction" element={<NonStudentRoute><InstructionDashboard /></NonStudentRoute>} />
        <Route path="instruction/curricula" element={<AdminRoute><CurriculaManagement /></AdminRoute>} />
        <Route path="instruction/syllabi" element={<NonStudentRoute><SyllabusListPage /></NonStudentRoute>} />
        <Route path="instruction/syllabi/:id" element={<NonStudentRoute><SyllabusDetailPage /></NonStudentRoute>} />
        <Route
          path="scheduling"
          element={(
            <NonStudentRoute>
              <Outlet />
            </NonStudentRoute>
          )}
        >
          <Route index element={<TimeBlocksPage />} />
          <Route path="rooms" element={<RoomsPage />} />
          <Route path="sections" element={<SectionsPage />} />
          <Route path="my-schedule" element={<MySchedulePage />} />
          <Route path="overview" element={<AdminRoute><SchedulingDashboard /></AdminRoute>} />
        </Route>
        <Route path="events" element={<ProtectedRoute><EventListPage /></ProtectedRoute>} />
        <Route path="events/create" element={<AdminRoute><EventCreationPage /></AdminRoute>} />
        <Route path="events/approval" element={<AdminRoute><EventApprovalPage /></AdminRoute>} />
        <Route path="events/calendar" element={<GlobalCalendarPage />} />
        <Route path="my-events" element={<MyEventsPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
