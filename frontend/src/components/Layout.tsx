import { useEffect, useRef } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { ROL_ADMIN } from '../config'
import { useAuth } from '../auth/AuthContext'

export function Layout() {
  const { sesion, cerrarSesion, tieneRol } = useAuth()
  const ubicacion = useLocation()
  const navegar = useNavigate()
  const principal = useRef<HTMLElement>(null)
  const rutaPrevia = useRef(ubicacion.pathname)

  // Gestión del foco: al cambiar de ruta el foco pasa al encabezado de la nueva página,
  // para que lectores de pantalla y teclado sepan que el contenido cambió.
  useEffect(() => {
    if (rutaPrevia.current === ubicacion.pathname) return
    rutaPrevia.current = ubicacion.pathname
    const titulo = principal.current?.querySelector<HTMLElement>('h1')
    ;(titulo ?? principal.current)?.focus()
  }, [ubicacion.pathname])

  function salir() {
    cerrarSesion()
    navegar('/login', { replace: true })
  }

  return (
    <>
      <a className="saltar-contenido" href="#contenido">
        Saltar al contenido principal
      </a>
      <header className="cabecera">
        <div className="contenedor barra">
          <p className="marca">Biblioteca</p>
          <nav aria-label="Principal">
            <ul className="menu">
              {sesion ? (
                <>
                  <li>
                    <NavLink to="/libros" end>
                      Libros
                    </NavLink>
                  </li>
                  {tieneRol(ROL_ADMIN) && (
                    <li>
                      <NavLink to="/libros/nuevo">Nuevo libro</NavLink>
                    </li>
                  )}
                </>
              ) : (
                <>
                  <li>
                    <NavLink to="/login">Ingresar</NavLink>
                  </li>
                  <li>
                    <NavLink to="/registro">Crear cuenta</NavLink>
                  </li>
                </>
              )}
            </ul>
          </nav>
          {sesion && (
            <div className="sesion">
              <p>
                Sesión: <strong>{sesion.nombreUsuario}</strong> ({sesion.rol})
              </p>
              <button type="button" className="boton boton-secundario" onClick={salir}>
                Cerrar sesión
              </button>
            </div>
          )}
        </div>
      </header>
      <main id="contenido" ref={principal} tabIndex={-1}>
        <div className="contenedor">
          <Outlet />
        </div>
      </main>
      <footer className="pie">
        <div className="contenedor">
          <p>Proyecto académico · Lenguaje de Programación Web II</p>
        </div>
      </footer>
    </>
  )
}
