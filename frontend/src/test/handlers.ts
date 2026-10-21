import { http, HttpResponse } from 'msw'
import { API_URL } from '../config'
import type { Libro } from '../api/schemas'

export const categoriasPrueba = [
  { idCategoria: 1, nombre: 'Ficción' },
  { idCategoria: 2, nombre: 'Ciencia y Tecnología' },
  { idCategoria: 3, nombre: 'Historia' },
]

function datosIniciales(): Libro[] {
  const base = [
    ['Cien años de soledad', 'Gabriel García Márquez', 1967, 10, 1],
    ['Don Quijote de la Mancha', 'Miguel de Cervantes', 1605, 5, 1],
    ['Breve historia del tiempo', 'Stephen Hawking', 1988, 7, 2],
    ['El código limpio', 'Robert C. Martin', 2008, 12, 2],
    ['Sapiens', 'Yuval Noah Harari', 2014, 15, 3],
    ['Las venas abiertas de América Latina', 'Eduardo Galeano', 1971, 8, 3],
    ['Meditaciones', 'Marco Aurelio', 180, 4, 3],
    ['Así habló Zaratustra', 'Friedrich Nietzsche', 1883, 6, 1],
  ] as const
  return base.map(([titulo, autor, anio, stock, idCategoria], i) => ({
    idLibro: i + 1,
    titulo,
    autor,
    isbn: `97800000${i}`,
    anio,
    stock,
    idCategoria,
    categoria: categoriasPrueba.find((c) => c.idCategoria === idCategoria)?.nombre ?? null,
  }))
}

let libros: Libro[] = datosIniciales()
let siguienteId = 100

export function reiniciarDatos() {
  libros = datosIniciales()
  siguienteId = 100
}

export function agregarLibroDePrueba(libro: Omit<Libro, 'idLibro'>) {
  libros.unshift({ ...libro, idLibro: siguienteId++ })
}

// Simula la autenticación de la API: tokens conocidos por rol.
function rolDe(request: Request): 'admin' | 'Lector' | null {
  const cabecera = request.headers.get('Authorization')
  if (cabecera === 'Bearer tok-admin') return 'admin'
  if (cabecera === 'Bearer tok-lector') return 'Lector'
  return null
}

const sinSesion = () => new HttpResponse(null, { status: 401 })
const prohibido = () => new HttpResponse(null, { status: 403 })

interface CuerpoLibro {
  titulo: string
  autor: string
  isbn: string
  anio: number
  stock: number
  idCategoria: number
}

function validar(cuerpo: CuerpoLibro) {
  const errors: Record<string, string[]> = {}
  if (cuerpo.stock < 0) errors.Stock = ['El stock no puede ser negativo (servidor).']
  if (!categoriasPrueba.some((c) => c.idCategoria === cuerpo.idCategoria)) {
    errors.IdCategoria = ['La categoría indicada no existe (servidor).']
  }
  return errors
}

export const handlers = [
  http.post(`${API_URL}/api/auth/login`, async ({ request }) => {
    const cuerpo = (await request.json()) as { nombreUsuario: string; password: string }
    const expiracion = new Date(Date.now() + 60 * 60_000).toISOString()
    if (cuerpo.nombreUsuario === 'admin_test' && cuerpo.password === 'Admin1234!') {
      return HttpResponse.json({ token: 'tok-admin', rol: 'admin', expiracion })
    }
    if (cuerpo.nombreUsuario === 'lector_test' && cuerpo.password === 'Lector1234!') {
      return HttpResponse.json({ token: 'tok-lector', rol: 'Lector', expiracion })
    }
    return HttpResponse.json({ mensaje: 'Credenciales inválidas' }, { status: 401 })
  }),

  http.post(`${API_URL}/api/auth/registro`, async ({ request }) => {
    const cuerpo = (await request.json()) as { nombreUsuario: string }
    if (cuerpo.nombreUsuario === 'ya_existe') {
      return HttpResponse.json({ mensaje: 'El nombre de usuario ya existe.' }, { status: 409 })
    }
    return HttpResponse.json({ idUsuario: 10, nombreUsuario: cuerpo.nombreUsuario }, { status: 201 })
  }),

  http.get(`${API_URL}/api/categorias`, ({ request }) => {
    if (!rolDe(request)) return sinSesion()
    return HttpResponse.json(categoriasPrueba)
  }),

  http.get(`${API_URL}/api/libros`, ({ request }) => {
    if (!rolDe(request)) return sinSesion()
    const url = new URL(request.url)
    const page = Number(url.searchParams.get('page') ?? 1)
    const pageSize = Number(url.searchParams.get('pageSize') ?? 10)
    const q = (url.searchParams.get('q') ?? '').toLowerCase()
    const idCategoria = Number(url.searchParams.get('idCategoria')) || undefined
    const filtrados = libros.filter(
      (l) =>
        (!q || l.titulo.toLowerCase().includes(q) || l.autor.toLowerCase().includes(q)) &&
        (!idCategoria || l.idCategoria === idCategoria),
    )
    const items = filtrados.slice((page - 1) * pageSize, page * pageSize)
    return HttpResponse.json({ items, total: filtrados.length, page, pageSize })
  }),

  http.get(`${API_URL}/api/libros/:id`, ({ request, params }) => {
    if (!rolDe(request)) return sinSesion()
    const libro = libros.find((l) => l.idLibro === Number(params.id))
    if (!libro) return HttpResponse.json({ mensaje: 'No se encontró el libro.' }, { status: 404 })
    return HttpResponse.json(libro)
  }),

  http.post(`${API_URL}/api/libros`, async ({ request }) => {
    const rol = rolDe(request)
    if (!rol) return sinSesion()
    if (rol !== 'admin') return prohibido()
    const cuerpo = (await request.json()) as CuerpoLibro
    const errors = validar(cuerpo)
    if (Object.keys(errors).length > 0) {
      return HttpResponse.json({ title: 'One or more validation errors occurred.', status: 400, errors }, { status: 400 })
    }
    const nuevo: Libro = {
      ...cuerpo,
      idLibro: siguienteId++,
      categoria: categoriasPrueba.find((c) => c.idCategoria === cuerpo.idCategoria)?.nombre ?? null,
    }
    libros.unshift(nuevo)
    return HttpResponse.json(nuevo, { status: 201 })
  }),

  http.put(`${API_URL}/api/libros/:id`, async ({ request, params }) => {
    const rol = rolDe(request)
    if (!rol) return sinSesion()
    if (rol !== 'admin') return prohibido()
    const indice = libros.findIndex((l) => l.idLibro === Number(params.id))
    if (indice < 0) return HttpResponse.json({ mensaje: 'No se encontró el libro.' }, { status: 404 })
    const cuerpo = (await request.json()) as CuerpoLibro
    const actualizado: Libro = {
      ...libros[indice],
      ...cuerpo,
      categoria: categoriasPrueba.find((c) => c.idCategoria === cuerpo.idCategoria)?.nombre ?? null,
    }
    libros[indice] = actualizado
    return HttpResponse.json(actualizado)
  }),

  http.delete(`${API_URL}/api/libros/:id`, ({ request, params }) => {
    const rol = rolDe(request)
    if (!rol) return sinSesion()
    if (rol !== 'admin') return prohibido()
    const antes = libros.length
    libros = libros.filter((l) => l.idLibro !== Number(params.id))
    if (libros.length === antes) {
      return HttpResponse.json({ mensaje: 'No se encontró el libro.' }, { status: 404 })
    }
    return new HttpResponse(null, { status: 204 })
  }),
]
