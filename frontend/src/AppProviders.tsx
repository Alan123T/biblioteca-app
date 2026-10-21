import { useEffect, useRef, useState, type ReactNode } from 'react'
import { MutationCache, QueryCache, QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { ApiError } from './api/errors'
import { AuthProvider } from './auth/AuthContext'

function crearCliente(alProhibido: () => void): QueryClient {
  const manejarError = (error: unknown) => {
    // Un 403 de la API lleva a la página de acceso denegado.
    if (error instanceof ApiError && error.status === 403) alProhibido()
  }
  const enPruebas = import.meta.env.MODE === 'test'
  return new QueryClient({
    queryCache: new QueryCache({ onError: manejarError }),
    mutationCache: new MutationCache({ onError: manejarError }),
    defaultOptions: {
      queries: {
        // Solo se reintenta ante caídas de red o errores 5xx, nunca ante errores 4xx.
        retry: (intentos, error) => {
          if (enPruebas || intentos >= 2) return false
          return !(error instanceof ApiError) || error.status === 0 || error.status >= 500
        },
        refetchOnWindowFocus: false,
        staleTime: 30_000,
      },
    },
  })
}

export function AppProviders({ children }: { children: ReactNode }) {
  const navegar = useNavigate()
  const navegarRef = useRef(navegar)
  useEffect(() => {
    navegarRef.current = navegar
  }, [navegar])
  const [cliente] = useState(() =>
    crearCliente(() => navegarRef.current('/acceso-denegado', { replace: true })),
  )

  return (
    <QueryClientProvider client={cliente}>
      <AuthProvider>{children}</AuthProvider>
    </QueryClientProvider>
  )
}
