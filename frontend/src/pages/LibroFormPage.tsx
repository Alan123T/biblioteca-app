import { useParams } from 'react-router-dom'
import { Cargando } from '../components/Cargando'
import { ErrorBanner } from '../components/ErrorBanner'
import { LibroForm } from '../components/LibroForm'
import { PageHeading } from '../components/PageHeading'
import { useCategorias, useLibro } from '../hooks/useLibros'
import { usePageTitle } from '../hooks/usePageTitle'

export function LibroFormPage() {
  const { id } = useParams()
  const editando = id !== undefined
  const idNumero = Number(id)
  const idValido = !editando || (Number.isInteger(idNumero) && idNumero > 0)
  usePageTitle(editando ? 'Editar libro' : 'Nuevo libro')

  const categorias = useCategorias()
  const libro = useLibro(editando && idValido ? idNumero : undefined)

  const cargando = categorias.isPending || (editando && idValido && libro.isPending)
  const error = categorias.error ?? (editando ? libro.error : null)
  const listo = categorias.data && (!editando || libro.data)

  return (
    <section className="panel panel-angosto">
      <PageHeading>{editando ? 'Editar libro' : 'Nuevo libro'}</PageHeading>
      {!idValido && <ErrorBanner mensaje="El identificador del libro no es válido." />}
      {idValido && cargando && !error && <Cargando texto="Cargando formulario…" />}
      {error && <ErrorBanner mensaje={error.message} />}
      {idValido && listo && categorias.data && (
        <LibroForm categorias={categorias.data} libro={editando ? libro.data : undefined} />
      )}
    </section>
  )
}
