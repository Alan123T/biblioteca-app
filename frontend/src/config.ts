const urlApi: string | undefined = import.meta.env.VITE_API_URL

if (!urlApi) {
  throw new Error('Falta VITE_API_URL. Copia .env.example como .env y define la URL de la API.')
}

// URL base de la API, tomada de las variables de entorno (sin barra final).
export const API_URL: string = urlApi.replace(/\/+$/, '')

export const ROL_ADMIN = 'admin'
export const ROL_LECTOR = 'Lector'
