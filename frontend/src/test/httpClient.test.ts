import { http, HttpResponse } from 'msw'
import { describe, expect, it, vi } from 'vitest'
import { ApiError } from '../api/errors'
import { request, setUnauthorizedHandler } from '../api/httpClient'
import { API_URL } from '../config'
import { listarLibros } from '../services/libroService'
import { guardarSesion } from './utils'
import { server } from './server'

async function capturarError(promesa: Promise<unknown>): Promise<ApiError> {
  try {
    await promesa
  } catch (error) {
    if (error instanceof ApiError) return error
    throw error
  }
  throw new Error('Se esperaba un ApiError y la llamada terminó bien')
}

describe('Cliente HTTP centralizado', () => {
  it('adjunta el token como Bearer cuando hay sesión', async () => {
    let cabecera: string | null = null
    server.use(
      http.get(`${API_URL}/api/prueba`, ({ request: peticion }) => {
        cabecera = peticion.headers.get('Authorization')
        return HttpResponse.json({ ok: true })
      }),
    )
    guardarSesion('admin')
    await request('/api/prueba')
    expect(cabecera).toBe('Bearer tok-admin')
  })

  it('no adjunta token en las llamadas sin autenticación (login)', async () => {
    let cabecera: string | null = 'sin-revisar'
    server.use(
      http.post(`${API_URL}/api/prueba`, ({ request: peticion }) => {
        cabecera = peticion.headers.get('Authorization')
        return HttpResponse.json({ ok: true })
      }),
    )
    guardarSesion('admin')
    await request('/api/prueba', { method: 'POST', body: {}, auth: false })
    expect(cabecera).toBeNull()
  })

  it('normaliza los errores de validación (400) y pasa las claves a camelCase', async () => {
    server.use(
      http.post(`${API_URL}/api/prueba`, () =>
        HttpResponse.json({ errors: { Stock: ['Muy bajo'], IdCategoria: ['No existe'] } }, { status: 400 }),
      ),
    )
    const error = await capturarError(request('/api/prueba', { method: 'POST', body: {} }))
    expect(error.status).toBe(400)
    expect(error.erroresDeCampo).toEqual({ stock: ['Muy bajo'], idCategoria: ['No existe'] })
  })

  it('traduce el 429 a un mensaje claro', async () => {
    server.use(http.get(`${API_URL}/api/prueba`, () => new HttpResponse(null, { status: 429 })))
    const error = await capturarError(request('/api/prueba'))
    expect(error.status).toBe(429)
    expect(error.message).toContain('Demasiados intentos')
  })

  it('no expone detalles internos en los errores 500', async () => {
    server.use(
      http.get(`${API_URL}/api/prueba`, () =>
        HttpResponse.json({ mensaje: 'Stack trace interno', detail: 'secreto' }, { status: 500 }),
      ),
    )
    const error = await capturarError(request('/api/prueba'))
    expect(error.message).not.toContain('Stack')
    expect(error.message).toContain('problema')
  })

  it('convierte una caída de red en un error con status 0', async () => {
    server.use(http.get(`${API_URL}/api/prueba`, () => HttpResponse.error()))
    const error = await capturarError(request('/api/prueba'))
    expect(error.status).toBe(0)
    expect(error.message).toContain('No se pudo conectar')
  })

  it('avisa del 401 en rutas protegidas para cerrar la sesión', async () => {
    const manejador = vi.fn()
    setUnauthorizedHandler(manejador)
    server.use(http.get(`${API_URL}/api/prueba`, () => new HttpResponse(null, { status: 401 })))
    await capturarError(request('/api/prueba'))
    expect(manejador).toHaveBeenCalledTimes(1)
    setUnauthorizedHandler(null)
  })

  it('no cierra la sesión cuando el 401 viene del login', async () => {
    const manejador = vi.fn()
    setUnauthorizedHandler(manejador)
    server.use(
      http.post(`${API_URL}/api/prueba`, () =>
        HttpResponse.json({ mensaje: 'Credenciales inválidas' }, { status: 401 }),
      ),
    )
    const error = await capturarError(request('/api/prueba', { method: 'POST', body: {}, auth: false }))
    expect(error.message).toBe('Credenciales inválidas')
    expect(manejador).not.toHaveBeenCalled()
    setUnauthorizedHandler(null)
  })

  it('rechaza una respuesta con formato inesperado (no confía en la API)', async () => {
    server.use(http.get(`${API_URL}/api/libros`, () => HttpResponse.json({ items: 'no-es-una-lista' })))
    guardarSesion('lector')
    const error = await capturarError(listarLibros({ page: 1, pageSize: 6 }))
    expect(error.status).toBe(502)
    expect(error.message).toContain('formato esperado')
  })
})
