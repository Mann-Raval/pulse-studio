import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import {
  SignInScreen,
  DashboardScreen,
  PMScreen,
  DeveloperScreen,
  ProjectBoardScreen,
  ActivityScreen,
} from './pages';
import { ProtectedRoute } from './components/auth/ProtectedRoute';

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Authentication Route */}
        <Route path="/" element={<SignInScreen />} />

        {/* Authenticated Workspace Routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute allowedRoles={['Admin']}>
              <DashboardScreen />
            </ProtectedRoute>
          }
        />

        <Route
          path="/pm"
          element={
            <ProtectedRoute allowedRoles={['PM', 'Admin']}>
              <PMScreen />
            </ProtectedRoute>
          }
        />

        <Route
          path="/developer"
          element={
            <ProtectedRoute allowedRoles={['Developer', 'Admin']}>
              <DeveloperScreen />
            </ProtectedRoute>
          }
        />

        <Route
          path="/project-board"
          element={
            <ProtectedRoute allowedRoles={['Admin', 'PM', 'Developer']}>
              <ProjectBoardScreen />
            </ProtectedRoute>
          }
        />

        <Route
          path="/activity"
          element={
            <ProtectedRoute allowedRoles={['Admin', 'PM', 'Developer']}>
              <ActivityScreen />
            </ProtectedRoute>
          }
        />

        {/* Fallback redirect */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
