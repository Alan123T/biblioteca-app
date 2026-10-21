import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from './AuthContext'

// Rutas privadas: sin sesión se redirige al login y se recuerda a dónde quería ir.
export function ProtectedRoute() {
  const { sesion } = useAuth()
  const ubicacion = useLocation()
  if (!sesion) {
    return <Navigate to="/login" replace state={{ desde: ubicacion.pathname + ubicacion.search }} />
  }
  return <Outlet />
}

// Rutas por rol: con sesión pero sin el rol necesario se lleva a "acceso denegado".
// Esto solo mejora la experiencia: la API valida el rol en cada endpoint.
export function RequireRole({ roles }: { roles: string[] }) {
  const { tieneRol } = useAuth()
  if (!tieneRol(...roles)) return <Navigate to="/acceso-denegado" replace />
  return <Outlet />
}

// Login y registro: si ya hay sesión no tiene sentido mostrarlos.
export function SoloPublico() {
  const { sesion } = useAuth()
  if (sesion) return <Navigate to="/libros" replace />
  return <Outlet />
}
