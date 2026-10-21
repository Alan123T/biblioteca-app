import { useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { ROL_ADMIN } from '../config'
import { useAuth } from '../auth/AuthContext'
import { Cargando } from '../components/Cargando'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { ErrorBanner } from '../components/ErrorBanner'
import { PageHeading } from '../components/PageHeading'
import { useEliminarLibro, useLibro } from '../hooks/useLibros'
import { usePageTitle } from '../hooks/usePageTitle'

export function LibroDetailPage() {
  usePageTitle('Detalle del libro')
  const { id } = useParams()
  const idNumero = Number(id)
  const idValido = Number.isInteger(idNumero) && idNumero > 0
  const navegar = useNavigate()
  const ubicacion = useLocation()
  const aviso = (ubicacion.state as { aviso?: string } | null)?.aviso
  const { tieneRol } = useAuth()
  const esAdmin = tieneRol(ROL_ADMIN)
  const libro = useLibro(idValido ? idNumero : undefined)
  const eliminar = useEliminarLibro()
  const [confirmando, setConfirmando] = useState(false)

  function confirmarEliminacion() {
    eliminar.mutate(idNumero, { onSuccess: () => navegar('/libros', { replace: true }) })
  }

  return (
    <section className="panel">
      <PageHeading>Detalle del libro</PageHeading>
      <div role="status">{aviso && <p className="aviso aviso-ok">{aviso}</p>}</div>

      {!idValido && <ErrorBanner mensaje="El identificador del libro no es válido." />}
      {idValido && libro.isPending && <Cargando texto="Cargando libro…" />}
      {libro.isError && <ErrorBanner mensaje={libro.error.message} onReintentar={() => libro.refetch()} />}

      {libro.data && (
        <article>
          <h2>{libro.data.titulo}</h2>
          <p className="autor">{libro.data.autor}</p>
          <dl className="datos datos-detalle">
            <div>
              <dt>Categoría</dt>
              <dd>{libro.data.categoria ?? 'Sin categoría'}</dd>
            </div>
            <div>
              <dt>Año de publicación</dt>
              <dd>{libro.data.anio}</dd>
            </div>
            <div>
              <dt>ISBN</dt>
              <dd>{libro.data.isbn ? libro.data.isbn : 'No registrado'}</dd>
            </div>
            <div>
              <dt>Stock disponible</dt>
              <dd>{libro.data.stock}</dd>
            </div>
          </dl>
          <div className="acciones">
            <Link className="boton boton-secundario" to="/libros">
              Volver al listado
            </Link>
            {esAdmin && (
              <>
                <Link className="boton" to={`/libros/${libro.data.idLibro}/editar`}>
                  Editar
                </Link>
                <button
                  type="button"
                  className="boton boton-peligro"
                  onClick={() => {
                    eliminar.reset()
                    setConfirmando(true)
                  }}
                >
                  Eliminar
                </button>
              </>
            )}
          </div>
        </article>
      )}

      {!libro.data && !libro.isPending && (
        <p>
          <Link to="/libros">Volver al listado</Link>
        </p>
      )}

      <ConfirmDialog
        abierto={confirmando}
        titulo="Eliminar libro"
        descripcion={`¿Seguro que quieres eliminar «${libro.data?.titulo ?? ''}»? Esta acción no se puede deshacer.`}
        textoConfirmar="Sí, eliminar"
        cargando={eliminar.isPending}
        error={eliminar.isError ? eliminar.error.message : undefined}
        onConfirmar={confirmarEliminacion}
        onCancelar={() => setConfirmando(false)}
      />
    </section>
  )
}
