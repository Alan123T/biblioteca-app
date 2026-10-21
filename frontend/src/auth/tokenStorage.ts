// Estrategia de almacenamiento: sessionStorage.
// - Sobrevive a recargar la página, pero se borra al cerrar la pestaña.
// - Riesgo: un script malicioso (XSS) podría leerlo. Se mitiga sin usar
//   dangerouslySetInnerHTML, renderizando todo como texto, con una CSP en el build
//   y con un JWT de corta duración (60 minutos).
// - El token nunca va en la URL ni se muestra en consola.

export interface Sesion {
  token: string
  rol: string
  nombreUsuario: string
  expiracion: string
}

const CLAVE = 'biblioteca.sesion'

export function fechaExpiracion(expiracion: string): number {
  // El servidor entrega 7 decimales en los segundos; se recortan a 3 para parsear.
  return Date.parse(expiracion.replace(/(\.\d{3})\d+/, '$1'))
}

function esSesion(valor: unknown): valor is Sesion {
  if (typeof valor !== 'object' || valor === null) return false
  const v = valor as Record<string, unknown>
  return (
    typeof v.token === 'string' &&
    typeof v.rol === 'string' &&
    typeof v.nombreUsuario === 'string' &&
    typeof v.expiracion === 'string'
  )
}

function leer(): Sesion | null {
  try {
    const crudo = sessionStorage.getItem(CLAVE)
    if (!crudo) return null
    const datos: unknown = JSON.parse(crudo)
    if (!esSesion(datos) || !(fechaExpiracion(datos.expiracion) > Date.now())) {
      limpiar()
      return null
    }
    return datos
  } catch {
    return null
  }
}

function guardar(sesion: Sesion): void {
  try {
    sessionStorage.setItem(CLAVE, JSON.stringify(sesion))
  } catch {
    // Si el navegador bloquea el almacenamiento, la sesión solo vive en memoria.
  }
}

function limpiar(): void {
  try {
    sessionStorage.removeItem(CLAVE)
  } catch {
    // Sin acción: no hay nada que limpiar.
  }
}

function getToken(): string | null {
  return leer()?.token ?? null
}

export const tokenStorage = { leer, guardar, limpiar, getToken }
