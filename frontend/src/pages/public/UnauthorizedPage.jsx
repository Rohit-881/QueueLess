import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ShieldAlert, ArrowLeft, LayoutDashboard, LogIn } from 'lucide-react';

export const UnauthorizedPage = () => {
  const { user, isAuthenticated } = useAuth();

  const userDashboard = user ? `/${user.role}` : '/login';

  return (
    <div className="min-h-screen bg-app-bg flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white border border-border-light rounded-2xl p-8 text-center shadow-card">
        <div className="w-14 h-14 rounded-2xl bg-semantic-dangerBg text-semantic-danger flex items-center justify-center mx-auto mb-4 border border-semantic-danger/20">
          <ShieldAlert className="w-7 h-7" />
        </div>
        <h1 className="text-xl font-bold text-text-primary mb-2">Access Denied</h1>
        <p className="text-sm text-text-secondary leading-relaxed mb-6">
          {isAuthenticated
            ? `Your current account (${user?.email}) has the role "${user?.role}" and does not have permission to view this specific page.`
            : 'You do not have the required permissions to access this page.'}
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          {isAuthenticated ? (
            <Link
              to={userDashboard}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-brand-indigo hover:bg-brand-indigoHover transition shadow-sm"
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Go to My Dashboard ({user?.role})</span>
            </Link>
          ) : (
            <Link
              to="/login"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-brand-indigo hover:bg-brand-indigoHover transition shadow-sm"
            >
              <LogIn className="w-4 h-4" />
              <span>Log In</span>
            </Link>
          )}

          <Link
            to="/login"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-text-secondary hover:text-text-primary hover:bg-app-secondary transition border border-border-light"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Switch Account</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default UnauthorizedPage;
