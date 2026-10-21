export type ErroresDeCampo = Record<string, string[]>

// Error normalizado: toda falla de la API llega a la interfaz con este formato.
export class ApiError extends Error {
  status: number
  erroresDeCampo: ErroresDeCampo

  constructor(status: number, mensaje: string, erroresDeCampo: ErroresDeCampo = {}) {
    super(mensaje)
    this.name = 'ApiError'
    this.status = status
    this.erroresDeCampo = erroresDeCampo
  }
}

export function mensajePorEstado(status: number): string {
  switch (status) {
    case 0:
      return 'No se pudo conectar con el servidor. Revisa tu conexión e inténtalo de nuevo.'
    case 401:
      return 'Tu sesión no es válida o expiró. Inicia sesión nuevamente.'
    case 403:
      return 'No tienes permiso para realizar esta acción.'
    case 404:
      return 'No se encontró el recurso solicitado.'
    case 429:
      return 'Demasiados intentos. Espera un minuto antes de volver a intentarlo.'
    default:
      return status >= 500
        ? 'El servidor tuvo un problema. Inténtalo más tarde.'
        : 'No se pudo completar la solicitud.'
  }
}
