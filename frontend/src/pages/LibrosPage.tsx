import { useEffect, useState, type FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import type { Libro } from '../api/schemas'
import { ROL_ADMIN } from '../config'
import { useAuth } from '../auth/AuthContext'
import { Cargando } from '../components/Cargando'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { ErrorBanner } from '../components/ErrorBanner'
import { PageHeading } from '../components/PageHeading'
import { Pagination } from '../components/Pagination'
import { useCategorias, useEliminarLibro, useLibros } from '../hooks/useLibros'
import { usePageTitle } from '../hooks/usePageTitle'

const TAMANO_PAGINA = 6

export function LibrosPage() {
  usePageTitle('Libros')
  const { tieneRol } = useAuth()
  const esAdmin = tieneRol(ROL_ADMIN)
  const [params, setParams] = useSearchParams()
  const pagina = Math.max(1, Number(params.get('page')) || 1)
  const q = params.get('q') ?? ''
  const idCategoria = Number(params.get('categoria')) || undefined

  const [texto, setTexto] = useState(q)
  const [categoria, setCategoria] = useState(idCategoria ? String(idCategoria) : '')
  useEffect(() => {
    setTexto(q)
    setCategoria(idCategoria ? String(idCategoria) : '')
  }, [q, idCategoria])

  const libros = useLibros({ page: pagina, pageSize: TAMANO_PAGINA, q: q || undefined, idCategoria })
  const categorias = useCategorias()
  const eliminar = useEliminarLibro()
  const [aEliminar, setAEliminar] = useState<Libro | null>(null)
  const [aviso, setAviso] = useState('')

  const total = libros.data?.total ?? 0
  const totalPaginas = Math.max(1, Math.ceil(total / TAMANO_PAGINA))

  // Si se borra el último libro de una página, se vuelve a la anterior.
  useEffect(() => {
    if (libros.data && libros.data.items.length === 0 && pagina > 1) {
      const nuevos = new URLSearchParams(params)
      nuevos.set('page', String(pagina - 1))
      setParams(nuevos, { replace: true })
    }
  }, [libros.data, pagina, params, setParams])

  function buscar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault()
    const nuevos = new URLSearchParams()
    if (texto.trim()) nuevos.set('q', texto.trim())
    if (categoria) nuevos.set('categoria', categoria)
    setParams(nuevos)
  }

  function limpiar() {
    setTexto('')
    setCategoria('')
    setParams(new URLSearchParams())
  }

  function cambiarPagina(nueva: number) {
    const nuevos = new URLSearchParams(params)
    nuevos.set('page', String(nueva))
    setParams(nuevos)
  }

  function cancelarEliminacion() {
    eliminar.reset()
    setAEliminar(null)
  }

  function confirmarEliminacion() {
    if (!aEliminar) return
    const titulo = aEliminar.titulo
    eliminar.mutate(aEliminar.idLibro, {
      onSuccess: () => {
        setAviso(`Se eliminó el libro «${titulo}».`)
        setAEliminar(null)
      },
    })
  }

  return (
    <section>
      <div className="encabezado-pagina">
        <PageHeading>Libros</PageHeading>
        {esAdmin && (
          <Link className="boton" to="/libros/nuevo">
            Nuevo libro
          </Link>
        )}
      </div>

      <form role="search" aria-label="Buscar libros" className="filtros" onSubmit={buscar}>
        <div className="campo">
          <label htmlFor="buscar">Buscar por título o autor</label>
          <input id="buscar" type="search" value={texto} onChange={(e) => setTexto(e.target.value)} />
        </div>
        <div className="campo">
          <label htmlFor="categoria">Categoría</label>
          <select id="categoria" value={categoria} onChange={(e) => setCategoria(e.target.value)}>
            <option value="">Todas</option>
            {categorias.data?.map((c) => (
              <option key={c.idCategoria} value={c.idCategoria}>
                {c.nombre}
              </option>
            ))}
          </select>
        </div>
        <div className="acciones">
          <button type="submit" className="boton">
            Buscar
          </button>
          <button type="button" className="boton boton-secundario" onClick={limpiar}>
            Limpiar filtros
          </button>
        </div>
      </form>

      <div role="status">{aviso && <p className="aviso aviso-ok">{aviso}</p>}</div>

      {libros.isPending && <Cargando texto="Cargando libros…" />}
      {libros.isError && <ErrorBanner mensaje={libros.error.message} onReintentar={() => libros.refetch()} />}

      {libros.data && (
        <>
          <p role="status" className="resumen">
            {total === 1 ? 'Se encontró 1 libro.' : `Se encontraron ${total} libros.`}
          </p>
          {libros.data.items.length === 0 ? (
            <p className="estado">No se encontraron libros con los filtros indicados.</p>
          ) : (
            <ul className="tarjetas" aria-busy={libros.isPlaceholderData}>
              {libros.data.items.map((libro) => (
                <li key={libro.idLibro} className="tarjeta">
                  <h2>{libro.titulo}</h2>
                  <p className="autor">{libro.autor}</p>
                  <dl className="datos">
                    <div>
                      <dt>Categoría</dt>
                      <dd>{libro.categoria ?? 'Sin categoría'}</dd>
                    </div>
                    <div>
                      <dt>Año</dt>
                      <dd>{libro.anio}</dd>
                    </div>
                    <div>
                      <dt>Stock</dt>
                      <dd>{libro.stock}</dd>
                    </div>
                  </dl>
                  <div className="acciones">
                    <Link
                      className="boton boton-secundario"
                      to={`/libros/${libro.idLibro}`}
                      aria-label={`Ver detalle de ${libro.titulo}`}
                    >
                      Ver detalle
                    </Link>
                    {esAdmin && (
                      <>
                        <Link
                          className="boton boton-secundario"
                          to={`/libros/${libro.idLibro}/editar`}
                          aria-label={`Editar ${libro.titulo}`}
                        >
                          Editar
                        </Link>
                        <button
                          type="button"
                          className="boton boton-peligro"
                          aria-label={`Eliminar ${libro.titulo}`}
                          onClick={() => {
                            setAviso('')
                            setAEliminar(libro)
                          }}
                        >
                          Eliminar
                        </button>
                      </>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
          {totalPaginas > 1 && (
            <Pagination pagina={pagina} totalPaginas={totalPaginas} onCambiar={cambiarPagina} />
          )}
        </>
      )}

      <ConfirmDialog
        abierto={aEliminar !== null}
        titulo="Eliminar libro"
        descripcion={`¿Seguro que quieres eliminar «${aEliminar?.titulo ?? ''}»? Esta acción no se puede deshacer.`}
        textoConfirmar="Sí, eliminar"
        cargando={eliminar.isPending}
        error={eliminar.isError ? eliminar.error.message : undefined}
        onConfirmar={confirmarEliminacion}
        onCancelar={cancelarEliminacion}
      />
    </section>
  )
}
