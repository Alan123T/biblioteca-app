# Biblioteca - Frontend

Aplicación en React que consume la API REST de Biblioteca (carpeta `backend`). Permite iniciar sesión, listar, buscar, ver, crear, editar y eliminar libros según el rol del usuario (`admin` puede escribir, `Lector` solo consulta).

## Requisitos

- Node.js 20.12 o superior (se probó con 20 y 22)
- La API corriendo en `http://localhost:5237` (ver el README de `backend`)

## Instalación y ejecución

```
cd frontend
copy .env.example .env
npm ci
npm run dev
```

La aplicación queda en http://localhost:5173 (ese puerto es el único origen permitido por el CORS de la API).

## Variables de entorno

| Variable | Descripción |
| --- | --- |
| `VITE_API_URL` | URL base de la API. Todo lo que empiece con `VITE_` queda visible en el navegador, por eso nunca se guardan llaves ni contraseñas aquí. |

El archivo `.env` no se sube al repositorio; `.env.example` sirve de plantilla.

## Scripts

| Comando | Qué hace |
| --- | --- |
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Revisa tipos y genera la versión de producción (con Content-Security-Policy) |
| `npm run preview` | Sirve la versión de producción en el puerto 5173 |
| `npm run lint` | ESLint con `eslint-plugin-jsx-a11y` (accesibilidad) |
| `npm test` | Pruebas de componentes (Vitest + Testing Library + MSW + axe-core) |
| `npm run e2e` | Prueba end-to-end con Playwright (necesita la API corriendo) |
| `npm audit` | Auditoría de dependencias |

Para la prueba e2e la primera vez hay que instalar el navegador: `npx playwright install chromium`.
Los usuarios de prueba son `admin_test` y `lector_test`; sus claves se pueden cambiar con las variables `E2E_ADMIN_PASSWORD` y `E2E_LECTOR_PASSWORD`. El login de la API tiene un límite de 5 intentos por minuto.

## Estructura

```
src/
  api/         cliente HTTP centralizado (httpClient), errores normalizados y esquemas del contrato (zod)
  services/    funciones que llaman a cada recurso de la API (libros, categorías, auth)
  hooks/       manejo de estado asíncrono con TanStack Query
  auth/        sesión, almacenamiento del token y guards de rutas
  components/  componentes reutilizables (formularios, diálogo, paginación, layout)
  pages/       pantallas
  test/        mocks de la API y pruebas
e2e/           prueba end-to-end
```

## Decisiones principales

- **Token JWT:** se guarda en `sessionStorage`. Se borra al cerrar la pestaña y sobrevive a recargar la página. El riesgo es que un script malicioso (XSS) lo lea; se reduce porque no se usa `dangerouslySetInnerHTML`, todo se muestra como texto, el build lleva una Content-Security-Policy y el token dura 60 minutos. Nunca va en la URL ni en la consola.
- **Sesión:** el logout limpia el token y la caché de datos. Si la API responde 401 se cierra la sesión y se redirige al login; si responde 403 se muestra la página de acceso denegado.
- **Roles:** la interfaz oculta las acciones que el rol no puede hacer, pero la API vuelve a validar el rol en cada endpoint.
- **Respuestas de la API:** se validan con zod antes de usarse y se renderizan siempre como texto.
- **Accesibilidad:** HTML semántico, enlace para saltar al contenido, etiquetas y errores asociados con `aria-describedby`, errores anunciados con `aria-live`, foco visible, foco movido al título al cambiar de ruta, diálogo nativo `<dialog>` y contraste mínimo 4.5:1.
- **Responsivo:** mobile-first desde 320 px, listado en tarjetas que pasa de 1 a 2 y 3 columnas, botones y campos de al menos 44 px.
