import { Link } from 'react-router-dom'
import { PageHeading } from '../components/PageHeading'
import { usePageTitle } from '../hooks/usePageTitle'

export function AccessDeniedPage() {
  usePageTitle('Acceso denegado')
  return (
    <section className="panel panel-angosto">
      <PageHeading>Acceso denegado</PageHeading>
      <p>No tienes permiso para ver esta página o realizar esta acción con tu rol actual.</p>
      <p>
        <Link className="boton" to="/libros">
          Volver a los libros
        </Link>
      </p>
    </section>
  )
}
