import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';

import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Farms from './pages/Farms';
import Zones from './pages/Zones';
import Plots from './pages/Plots';
import Plants from './pages/Plants';
import PlotQR from './pages/PlotQR';
import Tasks from './pages/Tasks';
import Problems from './pages/Problems';
import Users from './pages/Users';

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Public */}
            <Route path="/login" element={<Login />} />
            <Route path="/login/callback" element={<Login />} />

            {/* Protected */}
            <Route
              element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }
            >
              <Route path="/dashboard" element={<Dashboard />} />

              {/* Farms - owner, manager */}
              <Route
                path="/farms"
                element={
                  <ProtectedRoute roles={['owner', 'manager']}>
                    <Farms />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/farms/:id/zones"
                element={
                  <ProtectedRoute roles={['owner', 'manager']}>
                    <Zones />
                  </ProtectedRoute>
                }
              />

              {/* Zones & Plots - owner, manager */}
              <Route
                path="/zones/:id/plots"
                element={
                  <ProtectedRoute roles={['owner', 'manager']}>
                    <Plots />
                  </ProtectedRoute>
                }
              />

              {/* Plants - owner, manager */}
              <Route
                path="/plots/:id/plants"
                element={
                  <ProtectedRoute roles={['owner', 'manager']}>
                    <Plants />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/plots/:id/qr"
                element={
                  <ProtectedRoute roles={['owner', 'manager', 'worker']}>
                    <PlotQR />
                  </ProtectedRoute>
                }
              />

              {/* Tasks - all roles */}
              <Route path="/tasks" element={<Tasks />} />

              {/* Problems - all roles */}
              <Route path="/problems" element={<Problems />} />

              {/* Users - owner only */}
              <Route
                path="/users"
                element={
                  <ProtectedRoute roles={['owner']}>
                    <Users />
                  </ProtectedRoute>
                }
              />
            </Route>

            {/* Default redirect */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
