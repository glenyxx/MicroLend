import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import Login            from './pages/Login';
import Register         from './pages/Register';
import BorrowerDashboard from './pages/BorrowerDashboard';
import OfficerDashboard  from './pages/OfficerDashboard';
import ApplyLoan        from './pages/ApplyLoan';

// Smart redirect — sends each role to their correct dashboard
const DashboardRedirect = () => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" />;
  if (user.role === 'borrower') return <Navigate to="/borrower/dashboard" />;
  if (user.role === 'officer')  return <Navigate to="/officer/dashboard" />;
  if (user.role === 'admin')    return <Navigate to="/officer/dashboard" />;
  return <Navigate to="/login" />;
};

const App = () => (
  <AuthProvider>
    <BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: { fontFamily: 'DM Sans, sans-serif', fontSize: '14px' },
        }}
      />
      <Routes>
        {/* Public routes */}
        <Route path="/login"    element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Smart redirect based on role */}
        <Route path="/dashboard" element={
          <ProtectedRoute><DashboardRedirect /></ProtectedRoute>
        }/>

        {/* Borrower routes */}
        <Route path="/borrower/dashboard" element={
          <ProtectedRoute allowedRoles={['borrower']}>
            <BorrowerDashboard />
          </ProtectedRoute>
        }/>
        <Route path="/loans/apply" element={
          <ProtectedRoute allowedRoles={['borrower']}>
            <ApplyLoan />
          </ProtectedRoute>
        }/>

        {/* Officer and admin routes */}
        <Route path="/officer/dashboard" element={
          <ProtectedRoute allowedRoles={['officer', 'admin']}>
            <OfficerDashboard />
          </ProtectedRoute>
        }/>

        {/* Default redirect */}
        <Route path="/"            element={<Navigate to="/dashboard" />} />
        <Route path="/unauthorized" element={
          <div className="min-h-screen flex items-center justify-center">
            <p className="text-slate-500">You do not have access to this page.</p>
          </div>
        }/>
      </Routes>
    </BrowserRouter>
  </AuthProvider>
);

export default App;