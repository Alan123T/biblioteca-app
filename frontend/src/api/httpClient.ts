import { API_URL } from '../config'
import { tokenStorage } from '../auth/tokenStorage'
import { ApiError, mensajePorEstado, type ErroresDeCampo } from './errors'

// Cliente HTTP centralizado: toda llamada a la API pasa por aquí.
// - La URL base viene de variables de entorno.
// - Adjunta el JWT como Bearer.
// - Normaliza los errores en ApiError (sin mostrar detalles internos del servidor).
// - Ante un 401 en una ruta protegida avisa para cerrar la sesión.

type ManejadorNoAutorizado = () => void
let alNoAutorizado: ManejadorNoAutorizado | null = null

export function setUnauthorizedHandler(manejador: ManejadorNoAutorizado | null): void {
  alNoAutorizado = manejador
}

interface Opciones {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
  body?: unknown
  // false en login y registro: no llevan token y un 401 significa "credenciales inválidas".
  auth?: boolean
}

function esObjeto(valor: unknown): valor is Record<string, unknown> {
  return typeof valor === 'object' && valor !== null && !Array.isArray(valor)
}

async function leerJson(respuesta: Response): Promise<unknown> {
  try {
    return await respuesta.json()
  } catch {
    return null
  }
}

// La API devuelve las claves de validación en PascalCase ("Stock"); el formulario usa camelCase.
function extraerErroresDeCampo(datos: unknown): ErroresDeCampo {
  if (!esObjeto(datos) || !esObjeto(datos.errors)) return {}
  const resultado: ErroresDeCampo = {}
  for (const [clave, valor] of Object.entries(datos.errors)) {
    if (Array.isArray(valor)) {
      const campo = clave.charAt(0).toLowerCase() + clave.slice(1)
      resultado[campo] = valor.filter((m): m is string => typeof m === 'string')
    }
  }
  return resultado
}

function mensajeDeRespuesta(status: number, datos: unknown): string {
  if (status >= 500) return mensajePorEstado(status)
  if (esObjeto(datos) && typeof datos.mensaje === 'string') return datos.mensaje
  if (status === 400) return 'Revisa los campos marcados e inténtalo de nuevo.'
  return mensajePorEstado(status)
}

export async function request(ruta: string, opciones: Opciones = {}): Promise<unknown> {
  const { method = 'GET', body, auth = true } = opciones
  const cabeceras: Record<string, string> = { Accept: 'application/json' }
  const token = auth ? tokenStorage.getToken() : null
  if (token) cabeceras.Authorization = `Bearer ${token}`
  if (body !== undefined) cabeceras['Content-Type'] = 'application/json'

  let respuesta: Response
  try {
    respuesta = await fetch(`${API_URL}${ruta}`, {
      method,
      headers: cabeceras,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })
  } catch {
    throw new ApiError(0, mensajePorEstado(0))
  }

  if (respuesta.ok) {
    if (respuesta.status === 204) return null
    return leerJson(respuesta)
  }

  const datos = await leerJson(respuesta)
  const error = new ApiError(
    respuesta.status,
    mensajeDeRespuesta(respuesta.status, datos),
    extraerErroresDeCampo(datos),
  )
  if (respuesta.status === 401 && auth) alNoAutorizado?.()
  throw error
}
