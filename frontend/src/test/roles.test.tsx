import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { renderizarApp } from './utils'

describe('Autorización por roles', () => {
  it('el lector no ve las acciones de escritura', async () => {
    renderizarApp('/libros', 'lector')
    await screen.findByText('Cien años de soledad')
    expect(screen.queryByRole('link', { name: 'Nuevo libro' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /^Eliminar/ })).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /^Editar/ })).not.toBeInTheDocument()
  })

  it('el lector que entra a /libros/nuevo ve acceso denegado', async () => {
    renderizarApp('/libros/nuevo', 'lector')
    expect(await screen.findByRole('heading', { level: 1, name: 'Acceso denegado' })).toBeInTheDocument()
  })

  it('el lector que entra a editar un libro ve acceso denegado', async () => {
    renderizarApp('/libros/1/editar', 'lector')
    expect(await screen.findByRole('heading', { level: 1, name: 'Acceso denegado' })).toBeInTheDocument()
  })

  it('el admin ve crear, editar y eliminar', async () => {
    renderizarApp('/libros', 'admin')
    await screen.findByText('Cien años de soledad')
    expect(screen.getAllByRole('link', { name: 'Nuevo libro' }).length).toBeGreaterThan(0)
    expect(screen.getByRole('button', { name: 'Eliminar Cien años de soledad' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Editar Cien años de soledad' })).toBeInTheDocument()
  })

  it('una ruta inexistente muestra la página no encontrada', async () => {
    renderizarApp('/no-existe', 'lector')
    expect(await screen.findByRole('heading', { level: 1, name: 'Página no encontrada' })).toBeInTheDocument()
  })
})
