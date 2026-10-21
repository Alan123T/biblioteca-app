import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { tokenStorage } from '../auth/tokenStorage'
import { renderizarApp } from './utils'

describe('Autenticación', () => {
  it('muestra un error cuando las credenciales son inválidas', async () => {
    const usuario = userEvent.setup()
    renderizarApp('/login')
    await usuario.type(screen.getByLabelText('Usuario'), 'admin_test')
    await usuario.type(screen.getByLabelText('Contraseña'), 'clave-incorrecta')
    await usuario.click(screen.getByRole('button', { name: 'Ingresar' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Credenciales inválidas')
    expect(tokenStorage.leer()).toBeNull()
  })

  it('inicia sesión y muestra el listado de libros', async () => {
    const usuario = userEvent.setup()
    renderizarApp('/login')
    await usuario.type(screen.getByLabelText('Usuario'), 'admin_test')
    await usuario.type(screen.getByLabelText('Contraseña'), 'Admin1234!')
    await usuario.click(screen.getByRole('button', { name: 'Ingresar' }))
    expect(await screen.findByRole('heading', { level: 1, name: 'Libros' })).toBeInTheDocument()
    expect(await screen.findByText('Cien años de soledad')).toBeInTheDocument()
    expect(tokenStorage.leer()?.rol).toBe('admin')
    expect(screen.getByRole('button', { name: 'Cerrar sesión' })).toBeInTheDocument()
  })

  it('valida los campos obligatorios del login en el cliente', async () => {
    const usuario = userEvent.setup()
    renderizarApp('/login')
    await usuario.click(screen.getByRole('button', { name: 'Ingresar' }))
    expect(await screen.findByText('Ingresa tu usuario')).toBeInTheDocument()
    expect(screen.getByText('Ingresa tu contraseña')).toBeInTheDocument()
    expect(screen.getByLabelText('Usuario')).toHaveAttribute('aria-invalid', 'true')
  })

  it('redirige al login cuando se visita una ruta protegida sin sesión', async () => {
    renderizarApp('/libros')
    expect(await screen.findByRole('heading', { level: 1, name: 'Iniciar sesión' })).toBeInTheDocument()
  })

  it('cierra la sesión y limpia el estado', async () => {
    const usuario = userEvent.setup()
    renderizarApp('/libros', 'lector')
    await screen.findByText('Cien años de soledad')
    await usuario.click(screen.getByRole('button', { name: 'Cerrar sesión' }))
    expect(await screen.findByRole('heading', { level: 1, name: 'Iniciar sesión' })).toBeInTheDocument()
    expect(sessionStorage.getItem('biblioteca.sesion')).toBeNull()
  })

  it('cuando la API responde 401 cierra la sesión y avisa que expiró', async () => {
    renderizarApp('/libros', 'invalida')
    expect(await screen.findByRole('heading', { level: 1, name: 'Iniciar sesión' })).toBeInTheDocument()
    expect(await screen.findByText('Tu sesión expiró. Inicia sesión nuevamente.')).toBeInTheDocument()
    expect(sessionStorage.getItem('biblioteca.sesion')).toBeNull()
  })

  it('ignora una sesión guardada que ya expiró', () => {
    sessionStorage.setItem(
      'biblioteca.sesion',
      JSON.stringify({
        token: 'tok-admin',
        rol: 'admin',
        nombreUsuario: 'admin_test',
        expiracion: new Date(Date.now() - 1000).toISOString(),
      }),
    )
    expect(tokenStorage.leer()).toBeNull()
  })

  it('interpreta la fecha de expiración con 7 decimales que entrega la API', () => {
    sessionStorage.setItem(
      'biblioteca.sesion',
      JSON.stringify({
        token: 'tok-admin',
        rol: 'admin',
        nombreUsuario: 'admin_test',
        expiracion: '2999-10-20T23:18:06.1801727Z',
      }),
    )
    expect(tokenStorage.leer()?.token).toBe('tok-admin')
  })

  it('crea una cuenta y lleva al login con un aviso', async () => {
    const usuario = userEvent.setup()
    renderizarApp('/registro')
    await usuario.type(screen.getByLabelText(/^Usuario/), 'alumno_nuevo')
    await usuario.type(screen.getByLabelText(/^Contraseña/), 'ClaveSegura1')
    await usuario.type(screen.getByLabelText(/^Repetir contraseña/), 'ClaveSegura1')
    await usuario.click(screen.getByRole('button', { name: 'Crear cuenta' }))
    await waitFor(() => expect(screen.getByRole('heading', { level: 1, name: 'Iniciar sesión' })).toBeInTheDocument())
    expect(screen.getByText(/Cuenta creada para alumno_nuevo/)).toBeInTheDocument()
  })
})
