import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { setUnauthorizedHandler } from '../api/httpClient'
import * as authService from '../services/authService'
import { fechaExpiracion, tokenStorage, type Sesion } from './tokenStorage'

interface ValorAuth {
  sesion: Sesion | null
  sesionExpirada: boolean
  iniciarSesion: (nombreUsuario: string, password: string) => Promise<void>
  cerrarSesion: () => void
  tieneRol: (...roles: string[]) => boolean
}

const AuthContext = createContext<ValorAuth | null>(null)

const MAXIMO_TIMEOUT = 2_147_483_647

export function AuthProvider({ children }: { children: ReactNode }) {
  const clienteQuery = useQueryClient()
  const [sesion, setSesion] = useState<Sesion | null>(() => tokenStorage.leer())
  const [sesionExpirada, setSesionExpirada] = useState(false)

  const cerrarSesion = useCallback(() => {
    tokenStorage.limpiar()
    setSesion(null)
    // Se borran los datos en caché para que no queden visibles al siguiente usuario.
    clienteQuery.clear()
  }, [clienteQuery])

  const iniciarSesion = useCallback(async (nombreUsuario: string, password: string) => {
    const respuesta = await authService.login(nombreUsuario, password)
    const nueva: Sesion = {
      token: respuesta.token,
      rol: respuesta.rol,
      nombreUsuario,
      expiracion: respuesta.expiracion,
    }
    tokenStorage.guardar(nueva)
    setSesion(nueva)
    setSesionExpirada(false)
  }, [])

  // Un 401 de la API en una ruta protegida cierra la sesión y lleva al login.
  useEffect(() => {
    setUnauthorizedHandler(() => {
      cerrarSesion()
      setSesionExpirada(true)
    })
    return () => setUnauthorizedHandler(null)
  }, [cerrarSesion])

  // Cierra la sesión automáticamente cuando vence el token.
  useEffect(() => {
    if (!sesion) return
    const restante = fechaExpiracion(sesion.expiracion) - Date.now()
    const temporizador = window.setTimeout(
      () => {
        cerrarSesion()
        setSesionExpirada(true)
      },
      Math.min(Math.max(restante, 0), MAXIMO_TIMEOUT),
    )
    return () => window.clearTimeout(temporizador)
  }, [sesion, cerrarSesion])

  const tieneRol = useCallback(
    (...roles: string[]) =>
      sesion !== null && roles.some((rol) => rol.toLowerCase() === sesion.rol.toLowerCase()),
    [sesion],
  )

  const valor = useMemo(
    () => ({ sesion, sesionExpirada, iniciarSesion, cerrarSesion, tieneRol }),
    [sesion, sesionExpirada, iniciarSesion, cerrarSesion, tieneRol],
  )

  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>
}

export function useAuth(): ValorAuth {
  const valor = useContext(AuthContext)
  if (!valor) throw new Error('useAuth debe usarse dentro de AuthProvider')
  return valor
}
