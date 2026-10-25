import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  Sparkles,
  Clock,
  Smartphone,
  ShieldCheck,
  TrendingUp,
  ArrowRight,
  CheckCircle2,
  Users,
  Building2,
  Stethoscope,
  GraduationCap,
  Landmark,
} from 'lucide-react';

export const LandingPage = () => {
  const { isAuthenticated, user } = useAuth();

  const getDashboardLink = () => {
    if (!user) return '/customer';
    return `/${user.role}`;
  };

  return (
    <div className="min-h-screen bg-app-bg text-text-primary flex flex-col">
      {/* 1. Navigation Bar */}
      <nav className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-border-light">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-brand-indigo flex items-center justify-center text-white shadow-sm shadow-brand-indigo/30">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xl font-bold text-brand-navy tracking-tight">
                QueueLess
              </span>
              <span className="hidden sm:inline-block ml-2 text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-full bg-brand-softIndigo text-brand-indigo">
                Real-Time SaaS
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-3 sm:gap-4">
            {isAuthenticated ? (
              <Link
                to={getDashboardLink()}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-brand-indigo text-white hover:bg-brand-indigoHover transition shadow-sm"
              >
                <span>Go to Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="px-4 py-2 text-sm font-semibold text-text-secondary hover:text-text-primary transition"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-brand-indigo text-white hover:bg-brand-indigoHover transition shadow-sm"
                >
                  <span>Get Started</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* 2. Hero Section */}
      <section className="relative pt-12 pb-20 sm:pt-20 sm:pb-28 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-softIndigo text-brand-indigo text-xs sm:text-sm font-semibold mb-6 border border-brand-indigo/15 shadow-xs">
              <span className="w-2 h-2 rounded-full bg-brand-indigo animate-pulse-dot" />
              <span>Next-Gen Virtual Queue Platform</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-brand-navy tracking-tight leading-[1.15] mb-6">
              Your Time Matters.{' '}
              <span className="text-brand-indigo">Skip the Physical Queue.</span>
            </h1>

            <p className="text-lg sm:text-xl text-text-secondary font-normal leading-relaxed mb-8">
              Join queues from your phone, receive digital tokens, and track your turn in real time with precise estimated waiting times. Built for hospitals, universities, banks, and service centers.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to="/register"
                className="w-full sm:w-auto px-8 py-3.5 rounded-xl font-semibold bg-brand-indigo text-white hover:bg-brand-indigoHover transition shadow-md shadow-brand-indigo/25 text-base"
              >
                Join a Virtual Queue
              </Link>
              <Link
                to="/login"
                className="w-full sm:w-auto px-8 py-3.5 rounded-xl font-semibold bg-white border border-border-light text-text-primary hover:bg-slate-50 transition shadow-sm text-base"
              >
                Sign In as Staff / Admin
              </Link>
            </div>
          </div>

          {/* 3. Product Dashboard Live Preview */}
          <div className="mt-14 max-w-4xl mx-auto">
            <div className="bg-white rounded-2xl border border-border-light shadow-xl p-6 sm:p-8 relative">
              <div className="flex items-center justify-between pb-6 border-b border-border-light mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-red-400" />
                  <div className="w-3 h-3 rounded-full bg-amber-400" />
                  <div className="w-3 h-3 rounded-full bg-green-400" />
                  <span className="text-xs font-mono text-text-muted ml-2">
                    QueueLess Live Tracker • Student Administration
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-semantic-success animate-pulse-dot" />
                  <span className="text-xs font-semibold text-semantic-success">
                    Counter #1 Active
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                {/* Active Called Token */}
                <div className="bg-brand-softIndigo border border-brand-indigo/20 rounded-2xl p-6 text-center">
                  <span className="text-xs font-bold uppercase tracking-wider text-brand-indigo">
                    Now Serving at Counter
                  </span>
                  <div className="text-4xl font-extrabold font-tabular text-brand-navy my-2">
                    ADM-003
                  </div>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white text-brand-indigo border border-brand-indigo/20 shadow-xs">
                    <span className="w-2 h-2 rounded-full bg-brand-indigo animate-pulse" />
                    In Service
                  </span>
                </div>

                {/* Customer's Token Live Card */}
                <div className="bg-white border-2 border-brand-indigo rounded-2xl p-6 text-center shadow-lg relative">
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full text-[11px] font-bold bg-brand-indigo text-white uppercase tracking-wider">
                    Your Digital Token
                  </span>
                  <span className="text-xs font-semibold text-text-secondary mt-1 block">
                    Position #2 in Queue
                  </span>
                  <div className="text-4xl font-extrabold font-tabular text-brand-navy my-2">
                    ADM-005
                  </div>
                  <div className="flex items-center justify-center gap-2 text-xs font-semibold text-semantic-warning bg-semantic-warningBg px-3 py-1 rounded-full border border-semantic-warning/20">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Estimated wait: ~12 mins</span>
                  </div>
                </div>

                {/* Queue Summary Status */}
                <div className="space-y-3">
                  <div className="bg-app-secondary border border-border-light rounded-xl p-3.5 flex justify-between items-center">
                    <span className="text-xs font-medium text-text-secondary">Customers Ahead</span>
                    <span className="text-base font-bold font-tabular text-text-primary">1 Person</span>
                  </div>
                  <div className="bg-app-secondary border border-border-light rounded-xl p-3.5 flex justify-between items-center">
                    <span className="text-xs font-medium text-text-secondary">Average Service Time</span>
                    <span className="text-base font-bold font-tabular text-text-primary">8 mins</span>
                  </div>
                  <div className="bg-app-secondary border border-border-light rounded-xl p-3.5 flex justify-between items-center">
                    <span className="text-xs font-medium text-text-secondary">Today Served</span>
                    <span className="text-base font-bold font-tabular text-semantic-success">42 tokens</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Three-Step Workflow */}
      <section className="py-16 bg-white border-y border-border-light">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <h2 className="text-3xl font-bold text-brand-navy tracking-tight">
              Simple 3-Step Experience
            </h2>
            <p className="mt-2 text-text-secondary">
              Designed for effortless waiting without standing in physical lines.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-app-bg border border-border-light rounded-2xl p-6 text-center">
              <div className="w-12 h-12 rounded-2xl bg-brand-softIndigo text-brand-indigo flex items-center justify-center font-bold text-lg mx-auto mb-4 border border-brand-indigo/15">
                1
              </div>
              <h3 className="text-lg font-semibold text-text-primary mb-2">
                Choose a Service
              </h3>
              <p className="text-sm text-text-secondary leading-relaxed">
                Browse available clinics, student counters, or banking desks and view live queue availability before joining.
              </p>
            </div>

            <div className="bg-app-bg border border-border-light rounded-2xl p-6 text-center">
              <div className="w-12 h-12 rounded-2xl bg-brand-softTeal text-brand-teal flex items-center justify-center font-bold text-lg mx-auto mb-4 border border-brand-teal/15">
                2
              </div>
              <h3 className="text-lg font-semibold text-text-primary mb-2">
                Join the Virtual Queue
              </h3>
              <p className="text-sm text-text-secondary leading-relaxed">
                Click join to instantly allocate a unique digital token stored safely in the database with concurrency protection.
              </p>
            </div>

            <div className="bg-app-bg border border-border-light rounded-2xl p-6 text-center">
              <div className="w-12 h-12 rounded-2xl bg-semantic-successBg text-semantic-success flex items-center justify-center font-bold text-lg mx-auto mb-4 border border-semantic-success/15">
                3
              </div>
              <h3 className="text-lg font-semibold text-text-primary mb-2">
                Track Turn in Real Time
              </h3>
              <p className="text-sm text-text-secondary leading-relaxed">
                Your screen updates automatically via WebSockets when the counter advances. Arrive right when your number is called.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Verticals & Features Grid */}
      <section className="py-16 bg-app-bg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <h2 className="text-3xl font-bold text-brand-navy tracking-tight">
              Built for High-Footfall Organizations
            </h2>
            <p className="mt-2 text-text-secondary">
              Reliable queue operations for physical service centers of all kinds.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white border border-border-light rounded-2xl p-6 shadow-card hover:shadow-cardHover transition">
              <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center mb-4">
                <Stethoscope className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-text-primary mb-1">Hospitals & OPDs</h3>
              <p className="text-xs text-text-secondary leading-relaxed">
                Patient triage, doctor consultation queues, and pharmacy token issuance.
              </p>
            </div>

            <div className="bg-white border border-border-light rounded-2xl p-6 shadow-card hover:shadow-cardHover transition">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-brand-indigo flex items-center justify-center mb-4">
                <GraduationCap className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-text-primary mb-1">Universities & Colleges</h3>
              <p className="text-xs text-text-secondary leading-relaxed">
                Registrar counters, document verification, fee departments, and student advising.
              </p>
            </div>

            <div className="bg-white border border-border-light rounded-2xl p-6 shadow-card hover:shadow-cardHover transition">
              <div className="w-10 h-10 rounded-xl bg-teal-50 text-brand-teal flex items-center justify-center mb-4">
                <Landmark className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-text-primary mb-1">Banks & Financial</h3>
              <p className="text-xs text-text-secondary leading-relaxed">
                Cash counters, loan inquiries, account assistance, and branch management.
              </p>
            </div>

            <div className="bg-white border border-border-light rounded-2xl p-6 shadow-card hover:shadow-cardHover transition">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-4">
                <Building2 className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-text-primary mb-1">Public Administration</h3>
              <p className="text-xs text-text-secondary leading-relaxed">
                Municipal offices, licensing authorities, passport desks, and citizen services.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Footer */}
      <footer className="mt-auto bg-white border-t border-border-light py-8 text-center text-xs text-text-muted">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-brand-navy">QueueLess</span>
            <span>• Real-Time Queue & Appointment SaaS</span>
          </div>
          <p>© {new Date().getFullYear()} QueueLess Platform. Developed for MERN End-Term Viva.</p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
