import { Navigate, Route, Routes } from 'react-router-dom'
import { ROL_ADMIN } from './config'
import { ProtectedRoute, RequireRole, SoloPublico } from './auth/guards'
import { Layout } from './components/Layout'
import { AccessDeniedPage } from './pages/AccessDeniedPage'
import { LibroDetailPage } from './pages/LibroDetailPage'
import { LibroFormPage } from './pages/LibroFormPage'
import { LibrosPage } from './pages/LibrosPage'
import { LoginPage } from './pages/LoginPage'
import { NotFoundPage } from './pages/NotFoundPage'
import { RegisterPage } from './pages/RegisterPage'

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route element={<SoloPublico />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/registro" element={<RegisterPage />} />
        </Route>
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<Navigate to="/libros" replace />} />
          <Route path="/libros" element={<LibrosPage />} />
          <Route element={<RequireRole roles={[ROL_ADMIN]} />}>
            <Route path="/libros/nuevo" element={<LibroFormPage />} />
            <Route path="/libros/:id/editar" element={<LibroFormPage />} />
          </Route>
          <Route path="/libros/:id" element={<LibroDetailPage />} />
          <Route path="/acceso-denegado" element={<AccessDeniedPage />} />
        </Route>
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  )
}
