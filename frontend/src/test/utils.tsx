import { render } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { AppProviders } from '../AppProviders'
import { AppRoutes } from '../AppRoutes'

type TipoSesion = 'admin' | 'lector' | 'invalida'

export function guardarSesion(tipo: TipoSesion) {
  const sesion = {
    admin: { token: 'tok-admin', rol: 'admin', nombreUsuario: 'admin_test' },
    lector: { token: 'tok-lector', rol: 'Lector', nombreUsuario: 'lector_test' },
    invalida: { token: 'tok-invalido', rol: 'Lector', nombreUsuario: 'fantasma' },
  }[tipo]
  sessionStorage.setItem(
    'biblioteca.sesion',
    JSON.stringify({ ...sesion, expiracion: new Date(Date.now() + 60 * 60_000).toISOString() }),
  )
}

export function renderizarApp(ruta: string, sesion?: TipoSesion) {
  if (sesion) guardarSesion(sesion)
  return render(
    <MemoryRouter initialEntries={[ruta]}>
      <AppProviders>
        <AppRoutes />
      </AppProviders>
    </MemoryRouter>,
  )
}
