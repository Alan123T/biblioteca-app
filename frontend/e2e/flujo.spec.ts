import { expect, test } from '@playwright/test'

// Requisitos: la API corriendo (http://localhost:5237) con los usuarios de prueba,
// y el frontend en http://localhost:5173 (Playwright lo levanta solo si no está activo).
const usuarioAdmin = process.env.E2E_ADMIN_USER ?? 'admin_test'
const claveAdmin = process.env.E2E_ADMIN_PASSWORD ?? 'Admin1234!'
const usuarioLector = process.env.E2E_LECTOR_USER ?? 'lector_test'
const claveLector = process.env.E2E_LECTOR_PASSWORD ?? 'Lector1234!'

test('admin: inicia sesión, crea un libro, lo encuentra en el listado y lo elimina', async ({ page }) => {
  const titulo = `Libro E2E ${Date.now()}`

  await page.goto('/login')
  await page.getByLabel('Usuario').fill(usuarioAdmin)
  await page.getByLabel('Contraseña').fill(claveAdmin)
  await page.getByRole('button', { name: 'Ingresar' }).click()
  await expect(page.getByRole('heading', { level: 1, name: 'Libros' })).toBeVisible()

  await page.getByRole('link', { name: 'Nuevo libro' }).first().click()
  await expect(page.getByRole('heading', { level: 1, name: 'Nuevo libro' })).toBeVisible()
  await page.getByLabel('Título').fill(titulo)
  await page.getByLabel('Autor').fill('Autora de Prueba')
  await page.getByLabel('Año de publicación').fill('2020')
  await page.getByLabel('Stock').fill('3')
  await page.getByLabel('Categoría').selectOption({ label: 'Ficción' })
  await page.getByRole('button', { name: 'Guardar' }).click()
  await expect(page.getByText('Libro creado correctamente.')).toBeVisible()

  await page.getByRole('link', { name: 'Volver al listado' }).click()
  await page.getByLabel('Buscar por título o autor').fill(titulo)
  await page.getByRole('button', { name: 'Buscar' }).click()
  await expect(page.getByRole('heading', { level: 2, name: titulo })).toBeVisible()

  await page.getByRole('button', { name: `Eliminar ${titulo}` }).click()
  await page.getByRole('button', { name: 'Sí, eliminar' }).click()
  await expect(page.getByText(`Se eliminó el libro «${titulo}».`)).toBeVisible()
})

test('lector: puede consultar pero no ve acciones de escritura y no entra a /libros/nuevo', async ({ page }) => {
  await page.goto('/login')
  await page.getByLabel('Usuario').fill(usuarioLector)
  await page.getByLabel('Contraseña').fill(claveLector)
  await page.getByRole('button', { name: 'Ingresar' }).click()
  await expect(page.getByRole('heading', { level: 1, name: 'Libros' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Nuevo libro' })).toHaveCount(0)

  await page.goto('/libros/nuevo')
  await expect(page.getByRole('heading', { level: 1, name: 'Acceso denegado' })).toBeVisible()
})
