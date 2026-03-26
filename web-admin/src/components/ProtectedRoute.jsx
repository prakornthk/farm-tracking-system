import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LoadingSpinner } from '../components/Shared';

/**
 * ProtectedRoute - Role-based access control component
 *
 * Usage:
 *   <ProtectedRoute roles={['owner', 'manager']}>
 *     <SomeComponent />
 *   </ProtectedRoute>
 *
 * Role hierarchy:
 *   - owner: full access to everything
 *   - manager: can manage tasks, farms, zones, plots, plants
 *   - worker: read-only access to assigned plots and plants only
 *
 * Workers are blocked from:
 *   - /tasks (task management)
 *   - /farms, /zones, /plots (farm management)
 *   - /users (user management)
 */

export default function ProtectedRoute({ children, roles }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (roles && !roles.includes(user.role)) {
    // Redirect workers trying to access restricted areas
    console.warn(`[ProtectedRoute] Access denied for user "${user.name}" (role: ${user.role}) to path requiring: [${roles.join(', ')}]`);
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

/**
 * Hook for programmatic role checks inside components
 * Use this instead of direct user.role comparisons
 */
export function useRoleCheck() {
  const { user } = useAuth();

  return {
    isOwner: user?.role === 'owner',
    isManager: user?.role === 'owner' || user?.role === 'manager',
    isWorker: user?.role === 'worker',
    canManageTasks: user?.role === 'owner' || user?.role === 'manager',
    canManageFarms: user?.role === 'owner' || user?.role === 'manager',
    canManageUsers: user?.role === 'owner',
  };
}
