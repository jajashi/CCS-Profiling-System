import { Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import DashboardLayout from './pages/DashboardLayout';
import DashboardHome from './pages/DashboardHome';
import PlaceholderPage from './pages/PlaceholderPage';
import StudentInformation from './pages/StudentInformation';
import FacultyInformation from './pages/FacultyInformation';
import { auth } from './auth';

// Protected Route Wrapper
const ProtectedRoute = ({ children }) => {
  if (!auth.isAuthenticated()) {
    return <Navigate to="/" replace />;
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
        <Route path="faculty-info" element={<FacultyInformation />} />
        <Route path="instruction" element={<PlaceholderPage title="Instruction" />} />
        <Route path="scheduling" element={<PlaceholderPage title="Scheduling" />} />
        <Route path="events" element={<PlaceholderPage title="Events" />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
