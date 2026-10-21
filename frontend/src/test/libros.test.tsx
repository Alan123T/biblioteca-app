import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'
import { API_URL } from '../config'
import { agregarLibroDePrueba } from './handlers'
import { server } from './server'
import { renderizarApp } from './utils'

describe('Listado de libros', () => {
  it('muestra el estado de carga y luego las tarjetas con el total', async () => {
    renderizarApp('/libros', 'lector')
    expect(screen.getByText('Cargando libros…')).toBeInTheDocument()
    expect(await screen.findByText('Cien años de soledad')).toBeInTheDocument()
    expect(screen.getByText('Se encontraron 8 libros.')).toBeInTheDocument()
    expect(screen.getAllByRole('listitem').length).toBeGreaterThanOrEqual(6)
  })

  it('pagina el listado', async () => {
    const usuario = userEvent.setup()
    renderizarApp('/libros', 'lector')
    await screen.findByText('Cien años de soledad')
    expect(screen.getByText('Página 1 de 2')).toBeInTheDocument()
    await usuario.click(screen.getByRole('button', { name: 'Siguiente' }))
    expect(await screen.findByText('Página 2 de 2')).toBeInTheDocument()
    expect(await screen.findByText('Meditaciones')).toBeInTheDocument()
    expect(screen.queryByText('Cien años de soledad')).not.toBeInTheDocument()
  })

  it('busca por texto', async () => {
    const usuario = userEvent.setup()
    renderizarApp('/libros', 'lector')
    await screen.findByText('Cien años de soledad')
    await usuario.type(screen.getByLabelText('Buscar por título o autor'), 'quijote')
    await usuario.click(screen.getByRole('button', { name: 'Buscar' }))
    expect(await screen.findByText('Se encontró 1 libro.')).toBeInTheDocument()
    expect(screen.getByText('Don Quijote de la Mancha')).toBeInTheDocument()
    expect(screen.queryByText('Cien años de soledad')).not.toBeInTheDocument()
  })

  it('filtra por categoría', async () => {
    const usuario = userEvent.setup()
    renderizarApp('/libros', 'lector')
    await screen.findByText('Cien años de soledad')
    await screen.findByRole('option', { name: 'Historia' })
    await usuario.selectOptions(screen.getByLabelText('Categoría'), 'Historia')
    await usuario.click(screen.getByRole('button', { name: 'Buscar' }))
    expect(await screen.findByText('Se encontraron 3 libros.')).toBeInTheDocument()
    expect(screen.getByText('Sapiens')).toBeInTheDocument()
  })

  it('muestra el estado vacío cuando no hay resultados', async () => {
    const usuario = userEvent.setup()
    renderizarApp('/libros', 'lector')
    await screen.findByText('Cien años de soledad')
    await usuario.type(screen.getByLabelText('Buscar por título o autor'), 'zzzz')
    await usuario.click(screen.getByRole('button', { name: 'Buscar' }))
    expect(await screen.findByText('No se encontraron libros con los filtros indicados.')).toBeInTheDocument()
  })

  it('muestra un error genérico (sin detalles internos) cuando el servidor falla', async () => {
    server.use(
      http.get(`${API_URL}/api/libros`, () =>
        HttpResponse.json({ detail: 'System.NullReferenceException en LibroApi.cs línea 42' }, { status: 500 }),
      ),
    )
    renderizarApp('/libros', 'lector')
    const alerta = await screen.findByRole('alert')
    expect(alerta).toHaveTextContent('El servidor tuvo un problema')
    expect(alerta).not.toHaveTextContent('NullReferenceException')
    expect(within(alerta).getByRole('button', { name: 'Reintentar' })).toBeInTheDocument()
  })

  it('muestra el detalle de un libro', async () => {
    renderizarApp('/libros/2', 'lector')
    expect(await screen.findByRole('heading', { level: 2, name: 'Don Quijote de la Mancha' })).toBeInTheDocument()
    expect(screen.getByText('Miguel de Cervantes')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Volver al listado' })).toBeInTheDocument()
  })

  it('muestra un error cuando el libro no existe', async () => {
    renderizarApp('/libros/9999', 'lector')
    expect(await screen.findByRole('alert')).toHaveTextContent('No se encontró el libro.')
  })

  it('muestra como texto un título con código HTML (protección contra XSS)', async () => {
    const intento = '<img src=x onerror="alert(1)">'
    agregarLibroDePrueba({
      titulo: intento,
      autor: '<script>alert("xss")</script>',
      isbn: '1',
      anio: 2020,
      stock: 1,
      idCategoria: 1,
      categoria: 'Ficción',
    })
    const { container } = renderizarApp('/libros', 'lector')
    expect(await screen.findByText(intento)).toBeInTheDocument()
    expect(container.querySelector('img')).toBeNull()
    expect(container.querySelector('script')).toBeNull()
  })
})

describe('Crear, editar y eliminar libros (admin)', () => {
  it('crea un libro y muestra su detalle', async () => {
    const usuario = userEvent.setup()
    renderizarApp('/libros/nuevo', 'admin')
    await screen.findByRole('option', { name: 'Ficción' })
    await usuario.type(screen.getByLabelText(/^Título/), 'El nombre del viento')
    await usuario.type(screen.getByLabelText(/^Autor/), 'Patrick Rothfuss')
    await usuario.type(screen.getByLabelText(/^Año de publicación/), '2007')
    await usuario.type(screen.getByLabelText(/^Stock/), '4')
    await usuario.selectOptions(screen.getByLabelText(/^Categoría/), 'Ficción')
    await usuario.click(screen.getByRole('button', { name: 'Guardar' }))
    expect(await screen.findByRole('heading', { level: 2, name: 'El nombre del viento' })).toBeInTheDocument()
    expect(screen.getByText('Libro creado correctamente.')).toBeInTheDocument()
  })

  it('valida el formulario en el cliente y asocia los errores a cada campo', async () => {
    const usuario = userEvent.setup()
    renderizarApp('/libros/nuevo', 'admin')
    await screen.findByRole('option', { name: 'Ficción' })
    await usuario.click(screen.getByRole('button', { name: 'Guardar' }))
    const titulo = await screen.findByLabelText(/^Título/)
    expect(titulo).toHaveAttribute('aria-invalid', 'true')
    const idError = titulo.getAttribute('aria-describedby')
    expect(idError).toBeTruthy()
    expect(document.getElementById(idError as string)).toHaveTextContent('Ingresa el título')
    expect(screen.getByText('Selecciona una categoría', { selector: 'p' })).toBeInTheDocument()
    expect(screen.getByRole('alert')).toHaveTextContent('con errores')
  })

  it('rechaza un stock negativo antes de enviar', async () => {
    const usuario = userEvent.setup()
    renderizarApp('/libros/nuevo', 'admin')
    await screen.findByRole('option', { name: 'Ficción' })
    await usuario.type(screen.getByLabelText(/^Stock/), '-3')
    await usuario.click(screen.getByRole('button', { name: 'Guardar' }))
    expect(await screen.findByText('El stock no puede ser negativo')).toBeInTheDocument()
  })

  it('muestra junto al campo los errores de validación que devuelve la API (400)', async () => {
    const usuario = userEvent.setup()
    server.use(
      http.post(`${API_URL}/api/libros`, () =>
        HttpResponse.json(
          {
            title: 'One or more validation errors occurred.',
            status: 400,
            errors: { Titulo: ['Ya existe un libro con ese título (servidor).'] },
          },
          { status: 400 },
        ),
      ),
    )
    renderizarApp('/libros/nuevo', 'admin')
    await screen.findByRole('option', { name: 'Ficción' })
    await usuario.type(screen.getByLabelText(/^Título/), 'Repetido')
    await usuario.type(screen.getByLabelText(/^Autor/), 'Alguien')
    await usuario.type(screen.getByLabelText(/^Año de publicación/), '2000')
    await usuario.type(screen.getByLabelText(/^Stock/), '1')
    await usuario.selectOptions(screen.getByLabelText(/^Categoría/), 'Ficción')
    await usuario.click(screen.getByRole('button', { name: 'Guardar' }))
    expect(await screen.findByText('Ya existe un libro con ese título (servidor).')).toBeInTheDocument()
    expect(screen.getByLabelText(/^Título/)).toHaveAttribute('aria-invalid', 'true')
  })

  it('edita un libro existente', async () => {
    const usuario = userEvent.setup()
    renderizarApp('/libros/1/editar', 'admin')
    const titulo = await screen.findByDisplayValue('Cien años de soledad')
    await usuario.clear(titulo)
    await usuario.type(titulo, 'Cien años de soledad (edición revisada)')
    await usuario.click(screen.getByRole('button', { name: 'Guardar' }))
    expect(
      await screen.findByRole('heading', { level: 2, name: 'Cien años de soledad (edición revisada)' }),
    ).toBeInTheDocument()
    expect(screen.getByText('Libro actualizado correctamente.')).toBeInTheDocument()
  })

  it('elimina un libro solo después de confirmar', async () => {
    const usuario = userEvent.setup()
    renderizarApp('/libros', 'admin')
    await screen.findByText('Cien años de soledad')
    await usuario.click(screen.getByRole('button', { name: 'Eliminar Cien años de soledad' }))
    const dialogo = await screen.findByRole('dialog')
    expect(dialogo).toHaveTextContent('¿Seguro que quieres eliminar «Cien años de soledad»?')
    await usuario.click(within(dialogo).getByRole('button', { name: 'Sí, eliminar' }))
    expect(await screen.findByText('Se eliminó el libro «Cien años de soledad».')).toBeInTheDocument()
    expect(screen.getByText('Se encontraron 7 libros.')).toBeInTheDocument()
  })

  it('cancelar la confirmación no elimina nada', async () => {
    const usuario = userEvent.setup()
    renderizarApp('/libros', 'admin')
    await screen.findByText('Cien años de soledad')
    await usuario.click(screen.getByRole('button', { name: 'Eliminar Cien años de soledad' }))
    const dialogo = await screen.findByRole('dialog')
    await usuario.click(within(dialogo).getByRole('button', { name: 'Cancelar' }))
    expect(screen.getByText('Se encontraron 8 libros.')).toBeInTheDocument()
    expect(screen.getByText('Cien años de soledad')).toBeInTheDocument()
  })

  it('si la API responde 403 al eliminar, lleva a la página de acceso denegado', async () => {
    const usuario = userEvent.setup()
    server.use(http.delete(`${API_URL}/api/libros/:id`, () => new HttpResponse(null, { status: 403 })))
    renderizarApp('/libros', 'admin')
    await screen.findByText('Cien años de soledad')
    await usuario.click(screen.getByRole('button', { name: 'Eliminar Cien años de soledad' }))
    const dialogo = await screen.findByRole('dialog')
    await usuario.click(within(dialogo).getByRole('button', { name: 'Sí, eliminar' }))
    expect(await screen.findByRole('heading', { level: 1, name: 'Acceso denegado' })).toBeInTheDocument()
  })
})
