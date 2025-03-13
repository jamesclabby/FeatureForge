import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import PrivateRoute from './components/common/PrivateRoute';
import MainLayout from './components/layout/MainLayout';
import AuthContainer from './components/auth/AuthContainer';
import Dashboard from './pages/Dashboard';
import Home from './pages/Home';

function App() {
  return (
    <Router>
      <AuthProvider>
        <MainLayout>
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<AuthContainer />} />
            
            {/* Protected routes */}
            <Route element={<PrivateRoute />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/features" element={<div>Features Page (Coming Soon)</div>} />
            </Route>
            
            {/* Fallback route */}
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </MainLayout>
      </AuthProvider>
    </Router>
  );
}

export default App;
