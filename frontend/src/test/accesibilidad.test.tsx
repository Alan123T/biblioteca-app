import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import axe from 'axe-core'
import { describe, expect, it } from 'vitest'
import { renderizarApp } from './utils'

// Revisión automática con axe-core. La regla de contraste se revisa con Lighthouse
// en el navegador, porque jsdom no calcula estilos visuales.
async function revisar(contenedor: HTMLElement) {
  const resultados = await axe.run(contenedor, { rules: { 'color-contrast': { enabled: false } } })
  return resultados.violations.map((v) => `${v.id}: ${v.help} (${v.nodes.length} elementos)`)
}

describe('Accesibilidad (axe-core)', () => {
  it('la página de login no tiene violaciones', async () => {
    const { container } = renderizarApp('/login')
    await screen.findByRole('heading', { level: 1, name: 'Iniciar sesión' })
    expect(await revisar(container)).toEqual([])
  })

  it('la página de registro no tiene violaciones', async () => {
    const { container } = renderizarApp('/registro')
    await screen.findByRole('heading', { level: 1, name: 'Crear cuenta' })
    expect(await revisar(container)).toEqual([])
  })

  it('el listado de libros (admin) no tiene violaciones', async () => {
    const { container } = renderizarApp('/libros', 'admin')
    await screen.findByText('Cien años de soledad')
    expect(await revisar(container)).toEqual([])
  })

  it('el formulario de libro con errores no tiene violaciones', async () => {
    const usuario = userEvent.setup()
    const { container } = renderizarApp('/libros/nuevo', 'admin')
    await screen.findByRole('option', { name: 'Ficción' })
    await usuario.click(screen.getByRole('button', { name: 'Guardar' }))
    await screen.findByText('Ingresa el título')
    expect(await revisar(container)).toEqual([])
  })

  it('el diálogo de confirmación abierto no tiene violaciones', async () => {
    const usuario = userEvent.setup()
    const { container } = renderizarApp('/libros', 'admin')
    await screen.findByText('Cien años de soledad')
    await usuario.click(screen.getByRole('button', { name: 'Eliminar Cien años de soledad' }))
    await screen.findByRole('dialog')
    expect(await revisar(container)).toEqual([])
  })

  it('el documento declara el idioma español', async () => {
    const { readFileSync } = await import('node:fs')
    const html = readFileSync('index.html', 'utf-8')
    expect(html).toContain('<html lang="es">')
  })
})
