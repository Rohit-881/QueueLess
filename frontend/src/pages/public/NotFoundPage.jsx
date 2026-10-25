import React from 'react';
import { Link } from 'react-router-dom';
import { FileQuestion, Home } from 'lucide-react';

export const NotFoundPage = () => {
  return (
    <div className="min-h-screen bg-app-bg flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white border border-border-light rounded-2xl p-8 text-center shadow-card">
        <div className="w-14 h-14 rounded-2xl bg-app-secondary text-text-secondary flex items-center justify-center mx-auto mb-4 border border-border-light">
          <FileQuestion className="w-7 h-7" />
        </div>
        <div className="text-4xl font-extrabold font-tabular text-brand-navy mb-2">404</div>
        <h1 className="text-lg font-bold text-text-primary mb-2">Page Not Found</h1>
        <p className="text-sm text-text-secondary leading-relaxed mb-6">
          The requested page or route could not be found on QueueLess.
        </p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-brand-indigo hover:bg-brand-indigoHover transition shadow-sm"
        >
          <Home className="w-4 h-4" />
          <span>Go to Homepage</span>
        </Link>
      </div>
    </div>
  );
};

export default NotFoundPage;
