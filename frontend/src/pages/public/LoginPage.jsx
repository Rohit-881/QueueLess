import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Sparkles, Eye, EyeOff, Lock, Mail, ArrowRight, Shield, UserCheck, User } from 'lucide-react';

export const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMsg('Please fill in both email and password.');
      return;
    }

    try {
      setLoading(true);
      setErrorMsg('');
      const loggedInUser = await login(email, password);

      // Route to role-specific dashboard (avoid forwarding to mismatched or /unauthorized from-routes)
      const isDestinationValidForRole =
        from &&
        from !== '/login' &&
        from !== '/unauthorized' &&
        from !== '/' &&
        (from.startsWith(`/${loggedInUser.role}`) || (loggedInUser.role === 'admin'));

      if (isDestinationValidForRole) {
        navigate(from, { replace: true });
      } else {
        navigate(`/${loggedInUser.role}`, { replace: true });
      }
    } catch (err) {
      setErrorMsg(err.message || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (demoEmail, demoPassword) => {
    setEmail(demoEmail);
    setPassword(demoPassword);
    setErrorMsg('');
  };

  return (
    <div className="min-h-screen bg-app-bg flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link to="/" className="inline-flex items-center gap-2.5 mb-6">
          <div className="w-10 h-10 rounded-xl bg-brand-indigo flex items-center justify-center text-white shadow-md shadow-brand-indigo/30">
            <Sparkles className="w-5 h-5" />
          </div>
          <span className="text-2xl font-bold text-brand-navy tracking-tight">
            QueueLess
          </span>
        </Link>
        <h2 className="text-2xl font-bold text-text-primary tracking-tight">
          Sign In to Your Workspace
        </h2>
        <p className="mt-2 text-sm text-text-secondary">
          Manage live tokens, service counters, and queue capacity.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 sm:px-10 border border-border-light rounded-2xl shadow-card">
          {/* Quick Demo Fill Buttons (Viva Showcase) */}
          <div className="mb-6 pb-6 border-b border-border-light">
            <p className="text-xs font-bold uppercase tracking-wider text-text-secondary mb-3">
              One-Click Demo Credentials:
            </p>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => fillDemo('admin@queueless.com', 'Admin@123')}
                className="flex flex-col items-center p-2 rounded-xl border border-border-light hover:border-brand-indigo hover:bg-brand-softIndigo/40 transition text-center"
              >
                <Shield className="w-4 h-4 text-brand-navy mb-1" />
                <span className="text-[11px] font-bold text-brand-navy">Admin</span>
              </button>
              <button
                type="button"
                onClick={() => fillDemo('staff.sarah@queueless.com', 'Staff@123')}
                className="flex flex-col items-center p-2 rounded-xl border border-border-light hover:border-brand-teal hover:bg-brand-softTeal/40 transition text-center"
              >
                <UserCheck className="w-4 h-4 text-brand-teal mb-1" />
                <span className="text-[11px] font-bold text-brand-teal">Staff (OPD)</span>
              </button>
              <button
                type="button"
                onClick={() => fillDemo('john.customer@gmail.com', 'Customer@123')}
                className="flex flex-col items-center p-2 rounded-xl border border-border-light hover:border-brand-indigo hover:bg-brand-softIndigo/40 transition text-center"
              >
                <User className="w-4 h-4 text-brand-indigo mb-1" />
                <span className="text-[11px] font-bold text-brand-indigo">Customer</span>
              </button>
            </div>
          </div>

          {errorMsg && (
            <div className="mb-4 p-3 rounded-xl bg-semantic-dangerBg border border-semantic-danger/20 text-xs font-medium text-semantic-danger">
              {errorMsg}
            </div>
          )}

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <label className="block text-xs font-semibold text-text-primary mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-text-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  required
                  className="w-full pl-10 pr-4 py-2.5 text-sm bg-app-bg border border-border-light rounded-xl focus:outline-hidden focus:ring-2 focus:ring-brand-indigo/20 focus:border-brand-indigo transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-text-primary mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-text-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full pl-10 pr-10 py-2.5 text-sm bg-app-bg border border-border-light rounded-xl focus:outline-hidden focus:ring-2 focus:ring-brand-indigo/20 focus:border-brand-indigo transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary transition"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-xl text-sm font-semibold text-white bg-brand-indigo hover:bg-brand-indigoHover shadow-md shadow-brand-indigo/20 transition flex items-center justify-center gap-2 disabled:opacity-70"
            >
              {loading ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center text-xs text-text-secondary">
            Don't have an account yet?{' '}
            <Link
              to="/register"
              className="font-semibold text-brand-indigo hover:text-brand-indigoHover transition"
            >
              Register as Customer
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
