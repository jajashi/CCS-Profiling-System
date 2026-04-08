import { Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import DashboardLayout from './pages/DashboardLayout';
import DashboardHome from './pages/DashboardHome';
import PlaceholderPage from './pages/PlaceholderPage';
import StudentInformation from './pages/StudentInformation';
import FacultyInformation from './pages/FacultyInformation';
import { useAuth } from './context/AuthContext';

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
        <Route path="student-info" element={<StudentInformation />} />
        <Route path="student-info/:id" element={<StudentInformation />} />
        <Route path="faculty-info" element={<FacultyInformation />} />
        <Route path="faculty-info/:employeeId" element={<FacultyInformation />} />
        <Route
          path="reports"
          element={(
            <AdminRoute>
              <PlaceholderPage title="Reports" />
            </AdminRoute>
          )}
        />
        <Route path="instruction" element={<PlaceholderPage title="Instruction" />} />
        <Route path="scheduling" element={<PlaceholderPage title="Scheduling" />} />
        <Route path="events" element={<PlaceholderPage title="Events" />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
