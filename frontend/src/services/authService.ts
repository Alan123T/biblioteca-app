import { request } from '../api/httpClient'
import { validarRespuesta } from '../api/parse'
import { loginRespuestaSchema, registroRespuestaSchema } from '../api/schemas'

export async function login(nombreUsuario: string, password: string) {
  const datos = await request('/api/auth/login', {
    method: 'POST',
    body: { nombreUsuario, password },
    auth: false,
  })
  return validarRespuesta(loginRespuestaSchema, datos)
}

export async function registrar(nombreUsuario: string, password: string) {
  const datos = await request('/api/auth/registro', {
    method: 'POST',
    body: { nombreUsuario, password },
    auth: false,
  })
  return validarRespuesta(registroRespuestaSchema, datos)
}
