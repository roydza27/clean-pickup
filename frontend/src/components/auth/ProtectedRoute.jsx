import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return null; // or a loader

  // Not logged in
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Logged in but wrong role
  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    const redirectPath =
      {
        citizen: "/citizen",
        kabadiwala: "/kabadiwala",
        admin: "/admin",
      }[user.role] || "/";

    return <Navigate to={redirectPath} replace />;
  }

  return children;
};

export default ProtectedRoute;