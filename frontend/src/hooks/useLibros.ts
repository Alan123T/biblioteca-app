import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { LibroEntrada } from '../api/schemas'
import { listarCategorias } from '../services/categoriaService'
import {
  actualizarLibro,
  crearLibro,
  eliminarLibro,
  listarLibros,
  obtenerLibro,
  type FiltroLibros,
} from '../services/libroService'

export function useLibros(filtro: FiltroLibros) {
  return useQuery({
    queryKey: ['libros', filtro],
    queryFn: () => listarLibros(filtro),
    placeholderData: keepPreviousData,
  })
}

export function useLibro(id: number | undefined) {
  return useQuery({
    queryKey: ['libro', id],
    queryFn: () => obtenerLibro(id as number),
    enabled: id !== undefined,
  })
}

export function useCategorias() {
  return useQuery({
    queryKey: ['categorias'],
    queryFn: listarCategorias,
    staleTime: 5 * 60_000,
  })
}

export function useCrearLibro() {
  const cliente = useQueryClient()
  return useMutation({
    mutationFn: (entrada: LibroEntrada) => crearLibro(entrada),
    onSuccess: () => cliente.invalidateQueries({ queryKey: ['libros'] }),
  })
}

export function useActualizarLibro() {
  const cliente = useQueryClient()
  return useMutation({
    mutationFn: ({ id, datos }: { id: number; datos: LibroEntrada }) => actualizarLibro(id, datos),
    onSuccess: (libro) => {
      cliente.invalidateQueries({ queryKey: ['libros'] })
      cliente.setQueryData(['libro', libro.idLibro], libro)
    },
  })
}

export function useEliminarLibro() {
  const cliente = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => eliminarLibro(id),
    onSuccess: () => cliente.invalidateQueries({ queryKey: ['libros'] }),
  })
}
