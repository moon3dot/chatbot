import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuthStore } from './store/authStore';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import SiteManagement from './pages/SiteManagement';
import AdminManagement from './pages/AdminManagement';
import AdminPanel from './pages/AdminPanel';
import Reports from './pages/Reports';
import UserWidget from './pages/UserWidget';

// Components
import PrivateRoute from './components/PrivateRoute';
import Layout from './components/Layout';

function App() {
  const { isAuthenticated } = useAuthStore();

  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Toaster 
          position="top-center"
          reverseOrder={false}
          toastOptions={{
            duration: 3000,
            style: {
              background: '#363636',
              color: '#fff',
            },
          }}
        />
        
        <Routes>
          {/* مسیرهای عمومی */}
          <Route 
            path="/login" 
            element={isAuthenticated ? <Navigate to="/dashboard" /> : <Login />} 
          />
          <Route 
            path="/register" 
            element={isAuthenticated ? <Navigate to="/dashboard" /> : <Register />} 
          />

          {/* Widget (بدون احراز هویت) */}
          <Route path="/widget/user" element={<UserWidget />} />

          {/* مسیرهای خصوصی */}
          <Route element={<PrivateRoute />}>
            <Route element={<Layout />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/sites" element={<SiteManagement />} />
              <Route path="/sites/:siteId/admins" element={<AdminManagement />} />
              <Route path="/reports" element={<Reports />} />
            </Route>
          </Route>

          {/* پنل ادمین (بدون Layout) */}
          <Route path="/admin-panel/:siteId" element={<AdminPanel />} />

          {/* مسیر پیش‌فرض */}
          <Route path="/" element={<Navigate to="/dashboard" />} />
          <Route path="*" element={<Navigate to="/dashboard" />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;