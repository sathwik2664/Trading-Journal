import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { AccountProvider } from './context/AccountContext';
import { ThemeProvider } from './context/ThemeContext';
import ProtectedRoute from './components/auth/ProtectedRoute';
import Layout from './components/Layout/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Notebook from './pages/Notebook';
import Trades from './pages/Trades';
import Reports from './pages/Reports';
import Playbook from './pages/Playbook';
import AccountCenter from './pages/AccountCenter';

function App() {
  return (
    <ThemeProvider>
      {/*
        AuthProvider must be OUTSIDE Router so ProtectedRoute
        and Login can both access useAuth() anywhere in the tree.
      */}
      <AuthProvider>
        <Router>
          <Routes>

            {/* ── PUBLIC: Login page — no Layout, no sidebar ── */}
            <Route path="/login" element={<Login />} />

            {/* ── PROTECTED: all real app pages, wrapped in Layout ── */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <AccountProvider>
                    <Layout />
                  </AccountProvider>
                </ProtectedRoute>
              }
            >
              {/* Nested routes render inside <Layout> via its <Outlet /> */}
              <Route index element={<Dashboard />} />
              <Route path="notebook"  element={<Notebook />} />
              <Route path="trades"    element={<Trades />} />
              <Route path="reports"   element={<Reports />} />
              <Route path="playbook"  element={<Playbook />} />
              <Route path="account"   element={<AccountCenter />} />
            </Route>

            {/* ── Catch-all: redirect unknown URLs to dashboard ── */}
            <Route path="*" element={<Navigate to="/" replace />} />

          </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;