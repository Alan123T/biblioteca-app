import { request } from '../api/httpClient'
import { validarRespuesta } from '../api/parse'
import {
  libroSchema,
  paginaLibrosSchema,
  type Libro,
  type LibroEntrada,
  type PaginaLibros,
} from '../api/schemas'

export interface FiltroLibros {
  page: number
  pageSize: number
  q?: string
  idCategoria?: number
}

export async function listarLibros(filtro: FiltroLibros): Promise<PaginaLibros> {
  const params = new URLSearchParams({
    page: String(filtro.page),
    pageSize: String(filtro.pageSize),
  })
  if (filtro.q) params.set('q', filtro.q)
  if (filtro.idCategoria) params.set('idCategoria', String(filtro.idCategoria))
  const datos = await request(`/api/libros?${params.toString()}`)
  return validarRespuesta(paginaLibrosSchema, datos)
}

export async function obtenerLibro(id: number): Promise<Libro> {
  const datos = await request(`/api/libros/${id}`)
  return validarRespuesta(libroSchema, datos)
}

export async function crearLibro(entrada: LibroEntrada): Promise<Libro> {
  const datos = await request('/api/libros', { method: 'POST', body: entrada })
  return validarRespuesta(libroSchema, datos)
}

export async function actualizarLibro(id: number, entrada: LibroEntrada): Promise<Libro> {
  const datos = await request(`/api/libros/${id}`, { method: 'PUT', body: entrada })
  return validarRespuesta(libroSchema, datos)
}

export async function eliminarLibro(id: number): Promise<void> {
  await request(`/api/libros/${id}`, { method: 'DELETE' })
}
