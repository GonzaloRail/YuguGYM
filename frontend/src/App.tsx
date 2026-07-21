import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from '@/components/ui/sonner'
import { AuthProvider, useAuth } from '@/lib/auth'
import LoginPage from '@/pages/auth/LoginPage'
import ForgotPasswordPage from '@/pages/auth/ForgotPasswordPage'
import ResetPasswordPage from '@/pages/auth/ResetPasswordPage'
import DashboardLayout from '@/components/layout/DashboardLayout'
import DashboardPage from '@/pages/dashboard/DashboardPage'
import SociosPage from '@/pages/socios/SociosPage'
import MembresiasPage from '@/pages/membresias/MembresiasPage'
import PagosPage from '@/pages/pagos/PagosPage'
import AsistenciasPage from '@/pages/asistencias/AsistenciasPage'
import ReportesPage from '@/pages/reportes/ReportesPage'
import ChangePasswordPage from '@/pages/auth/ChangePasswordPage'
import RegisterAdminPage from '@/pages/auth/RegisterAdminPage'

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth()
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster />
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route
            path="/"
            element={
              <PrivateRoute>
                <DashboardLayout />
              </PrivateRoute>
            }
          >
            <Route index element={<DashboardPage />} />
            <Route path="socios" element={<SociosPage />} />
            <Route path="membresias" element={<MembresiasPage />} />
            <Route path="pagos" element={<PagosPage />} />
            <Route path="asistencias" element={<AsistenciasPage />} />
            <Route path="reportes" element={<ReportesPage />} />
            <Route path="cambiar-password" element={<ChangePasswordPage />} />
            <Route path="registrar-admin" element={<RegisterAdminPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
