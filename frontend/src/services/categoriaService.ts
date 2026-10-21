import { request } from '../api/httpClient'
import { validarRespuesta } from '../api/parse'
import { categoriasSchema, type Categoria } from '../api/schemas'

export async function listarCategorias(): Promise<Categoria[]> {
  const datos = await request('/api/categorias')
  return validarRespuesta(categoriasSchema, datos)
}
