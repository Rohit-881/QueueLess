import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ToastProvider } from './context/ToastContext';
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';

// Layout & Guards
import AppLayout from './components/layout/AppLayout';
import ProtectedRoute from './components/routing/ProtectedRoute';
import RoleGuard from './components/routing/RoleGuard';

// Public Pages
import LandingPage from './pages/public/LandingPage';
import LoginPage from './pages/public/LoginPage';
import RegisterPage from './pages/public/RegisterPage';
import UnauthorizedPage from './pages/public/UnauthorizedPage';
import NotFoundPage from './pages/public/NotFoundPage';

// Customer Pages
import CustomerOverview from './pages/customer/CustomerOverview';
import AvailableServices from './pages/customer/AvailableServices';
import MyQueueLive from './pages/customer/MyQueueLive';
import CustomerHistory from './pages/customer/CustomerHistory';
import CustomerProfile from './pages/customer/CustomerProfile';

// Staff Pages
import StaffDashboard from './pages/staff/StaffDashboard';
import StaffHistory from './pages/staff/StaffHistory';
import StaffProfile from './pages/staff/StaffProfile';

// Admin Pages
import AdminOverview from './pages/admin/AdminOverview';
import ServiceManagement from './pages/admin/ServiceManagement';
import QueueManagement from './pages/admin/QueueManagement';
import StaffManagement from './pages/admin/StaffManagement';
import AnalyticsDashboard from './pages/admin/AnalyticsDashboard';
import AdminProfile from './pages/admin/AdminProfile';

export const App = () => {
  return (
    <ToastProvider>
      <AuthProvider>
        <SocketProvider>
          <BrowserRouter>
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/unauthorized" element={<UnauthorizedPage />} />

              {/* Customer Routes */}
              <Route
                element={
                  <ProtectedRoute>
                    <RoleGuard allowedRoles={['customer', 'staff', 'admin']}>
                      <AppLayout />
                    </RoleGuard>
                  </ProtectedRoute>
                }
              >
                <Route path="/customer" element={<CustomerOverview />} />
                <Route path="/customer/services" element={<AvailableServices />} />
                <Route path="/customer/my-queue" element={<MyQueueLive />} />
                <Route path="/customer/history" element={<CustomerHistory />} />
                <Route path="/customer/profile" element={<CustomerProfile />} />
              </Route>

              {/* Staff Routes */}
              <Route
                element={
                  <ProtectedRoute>
                    <RoleGuard allowedRoles={['staff', 'admin']}>
                      <AppLayout />
                    </RoleGuard>
                  </ProtectedRoute>
                }
              >
                <Route path="/staff" element={<StaffDashboard />} />
                <Route path="/staff/queue" element={<StaffDashboard />} />
                <Route path="/staff/history" element={<StaffHistory />} />
                <Route path="/staff/profile" element={<StaffProfile />} />
              </Route>

              {/* Admin Routes */}
              <Route
                element={
                  <ProtectedRoute>
                    <RoleGuard allowedRoles={['admin']}>
                      <AppLayout />
                    </RoleGuard>
                  </ProtectedRoute>
                }
              >
                <Route path="/admin" element={<AdminOverview />} />
                <Route path="/admin/services" element={<ServiceManagement />} />
                <Route path="/admin/queues" element={<QueueManagement />} />
                <Route path="/admin/staff" element={<StaffManagement />} />
                <Route path="/admin/analytics" element={<AnalyticsDashboard />} />
                <Route path="/admin/profile" element={<AdminProfile />} />
              </Route>

              {/* 404 Catch-All */}
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </BrowserRouter>
        </SocketProvider>
      </AuthProvider>
    </ToastProvider>
  );
};

export default App;
