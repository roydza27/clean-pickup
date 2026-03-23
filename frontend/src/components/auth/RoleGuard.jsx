// src/components/auth/RoleGuard.jsx
import useAuthStore from '../../stores/authStore';

/**
 * RoleGuard - Conditionally renders children based on user role
 * @param {ReactNode} children - Content to render if user has required role
 * @param {string[]} allowedRoles - Array of roles allowed to see this content
 * @param {ReactNode} fallback - Content to render if user doesn't have required role
 */
const RoleGuard = ({ children, allowedRoles = [], fallback = null }) => {
  const { user, hasAnyRole } = useAuthStore();

  if (!user) {
    return fallback;
  }

  if (allowedRoles.length === 0 || hasAnyRole(allowedRoles)) {
    return children;
  }

  return fallback;
};

export default RoleGuard;

// Usage Examples:
/*
// Example 1: Show admin button only to admins
<RoleGuard allowedRoles={['admin']}>
  <button>Admin Settings</button>
</RoleGuard>

// Example 2: Show different content for different roles
<RoleGuard 
  allowedRoles={['citizen']} 
  fallback={<p>Only citizens can create pickup requests</p>}
>
  <CreatePickupButton />
</RoleGuard>

// Example 3: Multiple roles
<RoleGuard allowedRoles={['citizen', 'kabadiwala']}>
  <ViewPaymentsLink />
</RoleGuard>
*/