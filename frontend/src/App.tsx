import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Layout } from './components/Layout';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { CustomersPage } from './pages/CustomersPage';
import { OrdersPage } from './pages/OrdersPage';
import { LedgerPage } from './pages/LedgerPage';
import { RedemptionsPage } from './pages/RedemptionsPage';
import { ExpirationPage } from './pages/ExpirationPage';
import { TiersPage } from './pages/TiersPage';
import { AnomaliesPage } from './pages/AnomaliesPage';
import { GeneratorPage } from './pages/GeneratorPage';
import { ValidationPage } from './pages/ValidationPage';

export function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />

          {/* Protected Routes wrapped in standard Layout */}
          <Route
            path="/"
            element={
              <ProtectedRoute allowedRoles={['OPERATIONS_MANAGER', 'ANALYST']}>
                <Layout>
                  <DashboardPage />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/customers"
            element={
              <ProtectedRoute allowedRoles={['OPERATIONS_MANAGER', 'ANALYST', 'STORE_OPERATOR', 'CUSTOMER']}>
                <Layout>
                  <CustomersPage />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/orders"
            element={
              <ProtectedRoute allowedRoles={['OPERATIONS_MANAGER', 'STORE_OPERATOR', 'CUSTOMER']}>
                <Layout>
                  <OrdersPage />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/ledger"
            element={
              <ProtectedRoute allowedRoles={['OPERATIONS_MANAGER', 'CUSTOMER']}>
                <Layout>
                  <LedgerPage />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/redemptions"
            element={
              <ProtectedRoute allowedRoles={['OPERATIONS_MANAGER', 'CUSTOMER', 'ANALYST']}>
                <Layout>
                  <RedemptionsPage />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/expiration"
            element={
              <ProtectedRoute allowedRoles={['OPERATIONS_MANAGER']}>
                <Layout>
                  <ExpirationPage />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/tiers"
            element={
              <ProtectedRoute allowedRoles={['OPERATIONS_MANAGER', 'ANALYST']}>
                <Layout>
                  <TiersPage />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/anomalies"
            element={
              <ProtectedRoute allowedRoles={['OPERATIONS_MANAGER']}>
                <Layout>
                  <AnomaliesPage />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/generator"
            element={
              <ProtectedRoute allowedRoles={['OPERATIONS_MANAGER']}>
                <Layout>
                  <GeneratorPage />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/validation"
            element={
              <ProtectedRoute allowedRoles={['OPERATIONS_MANAGER', 'ANALYST']}>
                <Layout>
                  <ValidationPage />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
