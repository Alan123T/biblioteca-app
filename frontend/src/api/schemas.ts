import { z } from 'zod'

// Contrato de la API. Las respuestas se validan con estos esquemas antes de usarse
// (las respuestas de la API se tratan como datos no confiables).

export const libroSchema = z.object({
  idLibro: z.number(),
  titulo: z.string(),
  autor: z.string(),
  isbn: z.string().nullable().optional(),
  anio: z.number(),
  stock: z.number(),
  idCategoria: z.number(),
  categoria: z.string().nullable().optional(),
})

export const paginaLibrosSchema = z.object({
  items: z.array(libroSchema),
  total: z.number(),
  page: z.number(),
  pageSize: z.number(),
})

export const categoriaSchema = z.object({
  idCategoria: z.number(),
  nombre: z.string(),
})

export const categoriasSchema = z.array(categoriaSchema)

export const loginRespuestaSchema = z.object({
  token: z.string(),
  rol: z.string(),
  expiracion: z.string(),
})

export const registroRespuestaSchema = z.object({
  idUsuario: z.number(),
  nombreUsuario: z.string(),
})

export type Libro = z.infer<typeof libroSchema>
export type PaginaLibros = z.infer<typeof paginaLibrosSchema>
export type Categoria = z.infer<typeof categoriaSchema>
export type LoginRespuesta = z.infer<typeof loginRespuestaSchema>

export interface LibroEntrada {
  titulo: string
  autor: string
  isbn: string
  anio: number
  stock: number
  idCategoria: number
}
