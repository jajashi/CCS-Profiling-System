import { Routes, Route, Navigate, useParams, Outlet } from 'react-router-dom';
import LoginPage from './features/auth/routes/LoginPage';
import DashboardLayout from './components/Layout/DashboardLayout';
import DashboardHome from './features/dashboard/routes/DashboardHome';
import PlaceholderPage from './features/misc/routes/PlaceholderPage';
import StudentInformation from './features/students/routes/StudentInformation';
import FacultyInformation from './features/faculty/routes/FacultyInformation';
import SpecializationManagement from './features/faculty/routes/SpecializationManagement';
import FacultyDashboard from './features/faculty/routes/FacultyDashboard';
import CurriculaManagement from './features/instruction/routes/CurriculaManagement';
import SyllabusListPage from './features/instruction/routes/SyllabusListPage';
import SyllabusDetailPage from './features/instruction/routes/SyllabusDetailPage';
import TimeBlocksPage from './features/scheduling/routes/TimeBlocksPage';
import RoomsPage from './features/scheduling/routes/RoomsPage';
import MySchedulePage from './features/scheduling/routes/MySchedulePage';
import EventCreationPage from './features/events/routes/EventCreationPage';
import EventApprovalPage from './features/events/routes/EventApprovalPage';
import EventDetailPage from './features/events/routes/EventDetailPage';
import { useAuth } from './providers/AuthContext';

// Protected Route Wrapper
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }
  return children;
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

function App() {
  return (
    <Routes>
      <Route path="/" element={<LoginPage />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<DashboardHome />} />
        <Route path="student-info" element={<StudentDirectoryRoute><StudentInformation /></StudentDirectoryRoute>} />
        <Route path="student-info/:id" element={<StudentProfileRoute><StudentInformation /></StudentProfileRoute>} />
        
        <Route
          path="faculty"
          element={(
            <AdminRoute>
              <FacultyDashboard />
            </AdminRoute>
          )}
        />
        <Route path="faculty/directory" element={<NonStudentRoute><FacultyInformation /></NonStudentRoute>} />
        <Route path="faculty/directory/:employeeId" element={<NonStudentRoute><FacultyInformation /></NonStudentRoute>} />
        <Route
          path="faculty/specializations"
          element={(
            <AdminRoute>
              <SpecializationManagement />
            </AdminRoute>
          )}
        />
        <Route path="faculty/profile" element={<Navigate to="/dashboard/faculty/directory" replace />} />
        <Route path="faculty/profile/:employeeId" element={<NonStudentRoute><FacultyInformation /></NonStudentRoute>} />
        <Route path="faculty-info" element={<NonStudentRoute><FacultyInformation /></NonStudentRoute>} />
        <Route path="faculty-info/:employeeId" element={<NonStudentRoute><FacultyInformation /></NonStudentRoute>} />
        
        <Route
          path="reports"
          element={(
            <AdminRoute>
              <PlaceholderPage title="Reports" />
            </AdminRoute>
          )}
        />
        <Route path="instruction" element={<Navigate to="/dashboard/instruction/syllabi" replace />} />
        <Route path="instruction/curricula" element={<NonStudentRoute><CurriculaManagement /></NonStudentRoute>} />
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
          <Route path="my-schedule" element={<MySchedulePage />} />
        </Route>
        <Route path="events" element={<NonStudentRoute><EventCreationPage /></NonStudentRoute>} />
        <Route path="events/approval" element={<AdminRoute><EventApprovalPage /></AdminRoute>} />
        <Route path="events/:id" element={<EventDetailPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
