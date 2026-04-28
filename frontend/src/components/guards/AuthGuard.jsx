import { Navigate, useParams } from "react-router-dom";
import { useAuth } from "../../providers/AuthContext";
import ChangePasswordPage from "../../features/auth/routes/ChangePasswordPage";

export const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }
  return children;
};

export const PasswordReadyRoute = ({ children }) => {
  const { isAuthenticated, mustChangePassword } = useAuth();
  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }
  if (mustChangePassword) {
    return <Navigate to="/change-password" replace />;
  }
  return children;
};

export const ForcePasswordChangeRoute = () => {
  const { isAuthenticated, mustChangePassword } = useAuth();
  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }
  if (!mustChangePassword) {
    return <Navigate to="/dashboard" replace />;
  }
  return <ChangePasswordPage />;
};

export const AdminRoute = ({ children }) => {
  const { isAuthenticated, isAdmin } = useAuth();
  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }
  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
};

export const NonStudentRoute = ({ children }) => {
  const { isAuthenticated, isStudent } = useAuth();
  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }
  if (isStudent) {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
};

export const FacultyOnlyRoute = ({ children }) => {
  const { isAuthenticated, isFaculty, isStudent } = useAuth();
  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }
  if (isStudent || !isFaculty) {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
};

export const StudentDirectoryRoute = ({ children }) => {
  const { isAuthenticated, isStudent, user } = useAuth();
  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }
  if (isStudent && user?.studentId) {
    return <Navigate to={`/dashboard/student-info/${user.studentId}`} replace />;
  }
  return children;
};

export const StudentProfileRoute = ({ children }) => {
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

export const FacultyDirectoryRoute = ({ children }) => {
  const { isAuthenticated, isFaculty, user } = useAuth();
  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }
  if (isFaculty && user?.employeeId) {
    return <Navigate to={`/dashboard/faculty/directory/${encodeURIComponent(user.employeeId)}`} replace />;
  }
  return children;
};

export const FacultyProfileRoute = ({ children }) => {
  const { employeeId } = useParams();
  const { isAuthenticated, isFaculty, user } = useAuth();
  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }
  if (
    isFaculty &&
    user?.employeeId &&
    String(employeeId || "").toLowerCase() !== String(user.employeeId).toLowerCase()
  ) {
    return <Navigate to={`/dashboard/faculty/directory/${encodeURIComponent(user.employeeId)}`} replace />;
  }
  return children;
};

export const FacultyProfileIndexRedirect = () => {
  const { isFaculty, user } = useAuth();
  if (isFaculty && user?.employeeId) {
    return <Navigate to={`/dashboard/faculty/directory/${encodeURIComponent(user.employeeId)}`} replace />;
  }
  return <Navigate to="/dashboard/faculty/directory" replace />;
};
