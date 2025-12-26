import { useEffect } from 'react';
import { Navigate } from 'react-router';
import { useAuthContext } from 'app/contexts/auth/context';
import { toast } from 'sonner';

const AdminGuard = ({ children }) => {
  const { isAdmin, isAuthenticated, isInitialized } = useAuthContext();

  useEffect(() => {
    if (isInitialized && isAuthenticated && !isAdmin) {
      toast.error('Access Denied', {
        description: 'You do not have permission to access this page.',
        duration: 4000,
      });
    }
  }, [isAdmin, isAuthenticated, isInitialized]);

  if (!isInitialized) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!isAdmin) {
    return <Navigate to="/dashboards/home" replace />;
  }

  return children;
};

export default AdminGuard;
