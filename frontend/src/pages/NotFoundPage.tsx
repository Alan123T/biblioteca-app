import { Link } from 'react-router-dom'
import { PageHeading } from '../components/PageHeading'
import { usePageTitle } from '../hooks/usePageTitle'

export function NotFoundPage() {
  usePageTitle('Página no encontrada')
  return (
    <section className="panel panel-angosto">
      <PageHeading>Página no encontrada</PageHeading>
      <p>La dirección que buscas no existe.</p>
      <p>
        <Link className="boton" to="/libros">
          Ir a los libros
        </Link>
      </p>
    </section>
  )
}
