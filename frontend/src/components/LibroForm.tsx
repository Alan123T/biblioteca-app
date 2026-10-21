import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link, useNavigate } from 'react-router-dom'
import { ApiError } from '../api/errors'
import type { Categoria, Libro, LibroEntrada } from '../api/schemas'
import { useActualizarLibro, useCrearLibro } from '../hooks/useLibros'
import { ErrorBanner } from './ErrorBanner'
import { FormField } from './FormField'

const anioActual = new Date().getFullYear()

const esquema = z.object({
  titulo: z
    .string()
    .trim()
    .min(1, 'Ingresa el título')
    .max(150, 'El título no puede superar 150 caracteres'),
  autor: z
    .string()
    .trim()
    .min(1, 'Ingresa el autor')
    .max(120, 'El autor no puede superar 120 caracteres'),
  isbn: z.string().trim().max(20, 'El ISBN no puede superar 20 caracteres').optional(),
  anio: z
    .number({ invalid_type_error: 'Ingresa el año como número' })
    .int('El año debe ser un número entero')
    .min(1, 'El año debe ser mayor a 0')
    .max(anioActual, `El año no puede ser mayor a ${anioActual}`),
  stock: z
    .number({ invalid_type_error: 'Ingresa el stock como número' })
    .int('El stock debe ser un número entero')
    .min(0, 'El stock no puede ser negativo'),
  idCategoria: z.number({ invalid_type_error: 'Selecciona una categoría' }),
})
type DatosLibro = z.infer<typeof esquema>

const CAMPOS = ['titulo', 'autor', 'isbn', 'anio', 'stock', 'idCategoria'] as const

interface Props {
  categorias: Categoria[]
  libro?: Libro
}

export function LibroForm({ categorias, libro }: Props) {
  const navegar = useNavigate()
  const crear = useCrearLibro()
  const actualizar = useActualizarLibro()
  const [errorGeneral, setErrorGeneral] = useState<string>()
  const {
    register,
    handleSubmit,
    setError,
    setFocus,
    formState: { errors },
  } = useForm<DatosLibro>({
    resolver: zodResolver(esquema),
    defaultValues: libro
      ? {
          titulo: libro.titulo,
          autor: libro.autor,
          isbn: libro.isbn ?? '',
          anio: libro.anio,
          stock: libro.stock,
          idCategoria: libro.idCategoria,
        }
      : { titulo: '', autor: '', isbn: '' },
  })
  const enviando = crear.isPending || actualizar.isPending
  const cantidadErrores = Object.keys(errors).length

  const alEnviar = handleSubmit(async (valores) => {
    setErrorGeneral(undefined)
    const datos: LibroEntrada = {
      titulo: valores.titulo,
      autor: valores.autor,
      isbn: valores.isbn ?? '',
      anio: valores.anio,
      stock: valores.stock,
      idCategoria: valores.idCategoria,
    }
    try {
      const guardado = libro
        ? await actualizar.mutateAsync({ id: libro.idLibro, datos })
        : await crear.mutateAsync(datos)
      navegar(`/libros/${guardado.idLibro}`, {
        state: { aviso: libro ? 'Libro actualizado correctamente.' : 'Libro creado correctamente.' },
      })
    } catch (error) {
      if (!(error instanceof ApiError)) throw error
      setErrorGeneral(error.message)
      // Los errores de validación que devuelve la API se muestran junto a cada campo.
      let primero: (typeof CAMPOS)[number] | null = null
      for (const campo of CAMPOS) {
        const mensaje = error.erroresDeCampo[campo]?.[0]
        if (mensaje) {
          setError(campo, { type: 'server', message: mensaje })
          primero = primero ?? campo
        }
      }
      if (primero) setFocus(primero)
    }
  })

  return (
    <form onSubmit={alEnviar} noValidate>
      <p className="ayuda">Los campos marcados con * son obligatorios.</p>
      <div>
        {errorGeneral ? (
          <ErrorBanner mensaje={errorGeneral} />
        ) : (
          cantidadErrores > 0 && (
            <p role="alert" className="aviso aviso-error">
              <span aria-hidden="true">⚠ </span>
              Hay {cantidadErrores} {cantidadErrores === 1 ? 'campo' : 'campos'} con errores. Revísalos antes de guardar.
            </p>
          )
        )}
      </div>

      <FormField id="titulo" label="Título" required error={errors.titulo?.message}>
        {(a11y) => <input type="text" {...a11y} {...register('titulo')} />}
      </FormField>
      <FormField id="autor" label="Autor" required error={errors.autor?.message}>
        {(a11y) => <input type="text" {...a11y} {...register('autor')} />}
      </FormField>
      <FormField id="isbn" label="ISBN" error={errors.isbn?.message} hint="Opcional. Máximo 20 caracteres.">
        {(a11y) => <input type="text" {...a11y} {...register('isbn')} />}
      </FormField>
      <FormField id="anio" label="Año de publicación" required error={errors.anio?.message}>
        {(a11y) => <input type="number" inputMode="numeric" {...a11y} {...register('anio', { valueAsNumber: true })} />}
      </FormField>
      <FormField id="stock" label="Stock" required error={errors.stock?.message}>
        {(a11y) => <input type="number" inputMode="numeric" {...a11y} {...register('stock', { valueAsNumber: true })} />}
      </FormField>
      <FormField id="idCategoria" label="Categoría" required error={errors.idCategoria?.message}>
        {(a11y) => (
          <select {...a11y} {...register('idCategoria', { valueAsNumber: true })}>
            <option value="">Selecciona una categoría</option>
            {categorias.map((c) => (
              <option key={c.idCategoria} value={c.idCategoria}>
                {c.nombre}
              </option>
            ))}
          </select>
        )}
      </FormField>

      <div className="acciones">
        <button type="submit" className="boton" disabled={enviando}>
          {enviando ? 'Guardando…' : 'Guardar'}
        </button>
        <Link className="boton boton-secundario" to={libro ? `/libros/${libro.idLibro}` : '/libros'}>
          Cancelar
        </Link>
      </div>
    </form>
  )
}
