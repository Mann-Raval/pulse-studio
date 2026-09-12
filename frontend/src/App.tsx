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
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { ThemeProvider } from './context/ThemeContext';
import { SearchProvider } from './context/SearchContext';

export function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <SocketProvider>
            <SearchProvider>
              <Routes>
            {/* Public Authentication Route */}
            <Route path="/" element={<SignInScreen />} />

            {/* Authenticated Workspace Routes */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute allowedRoles={['Admin', 'ADMIN']}>
                  <DashboardScreen />
                </ProtectedRoute>
              }
            />

            <Route
              path="/pm"
              element={
                <ProtectedRoute allowedRoles={['PM', 'Admin', 'ADMIN']}>
                  <PMScreen />
                </ProtectedRoute>
              }
            />

            <Route
              path="/developer"
              element={
                <ProtectedRoute allowedRoles={['Developer', 'DEVELOPER', 'Admin', 'ADMIN']}>
                  <DeveloperScreen />
                </ProtectedRoute>
              }
            />

            <Route
              path="/project-board"
              element={
                <ProtectedRoute allowedRoles={['Admin', 'ADMIN', 'PM', 'Developer', 'DEVELOPER']}>
                  <ProjectBoardScreen />
                </ProtectedRoute>
              }
            />

            <Route
              path="/activity"
              element={
                <ProtectedRoute allowedRoles={['Admin', 'ADMIN', 'PM', 'Developer', 'DEVELOPER']}>
                  <ActivityScreen />
                </ProtectedRoute>
              }
            />

            {/* Fallback redirect */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </SearchProvider>
      </SocketProvider>
    </AuthProvider>
  </ThemeProvider>
</BrowserRouter>
  );
}

export default App;
