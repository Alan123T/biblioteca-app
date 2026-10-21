import type { z, ZodTypeAny } from 'zod'
import { ApiError } from './errors'

// Valida que la respuesta tenga el formato esperado antes de usarla.
export function validarRespuesta<S extends ZodTypeAny>(esquema: S, datos: unknown): z.output<S> {
  const resultado = esquema.safeParse(datos)
  if (!resultado.success) {
    throw new ApiError(502, 'La respuesta del servidor no tiene el formato esperado.')
  }
  return resultado.data
}
