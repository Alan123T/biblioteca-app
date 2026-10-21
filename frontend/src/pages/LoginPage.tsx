import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { ApiError } from '../api/errors'
import { useAuth } from '../auth/AuthContext'
import { ErrorBanner } from '../components/ErrorBanner'
import { FormField } from '../components/FormField'
import { PageHeading } from '../components/PageHeading'
import { usePageTitle } from '../hooks/usePageTitle'

const esquema = z.object({
  nombreUsuario: z.string().trim().min(1, 'Ingresa tu usuario'),
  password: z.string().min(1, 'Ingresa tu contraseña'),
})
type DatosLogin = z.infer<typeof esquema>

interface EstadoUbicacion {
  desde?: string
  registrado?: string
}

export function LoginPage() {
  usePageTitle('Iniciar sesión')
  const { iniciarSesion, sesionExpirada } = useAuth()
  const navegar = useNavigate()
  const ubicacion = useLocation()
  const estado = (ubicacion.state as EstadoUbicacion | null) ?? {}
  const [errorApi, setErrorApi] = useState<string>()
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<DatosLogin>({ resolver: zodResolver(esquema) })

  const alEnviar = handleSubmit(async (datos) => {
    setErrorApi(undefined)
    try {
      await iniciarSesion(datos.nombreUsuario, datos.password)
      navegar(estado.desde ?? '/libros', { replace: true })
    } catch (error) {
      setErrorApi(error instanceof ApiError ? error.message : 'No se pudo iniciar sesión.')
    }
  })

  return (
    <section className="panel panel-angosto">
      <PageHeading>Iniciar sesión</PageHeading>
      <div role="status">
        {sesionExpirada && (
          <p className="aviso aviso-info">Tu sesión expiró. Inicia sesión nuevamente.</p>
        )}
        {estado.registrado && (
          <p className="aviso aviso-ok">
            Cuenta creada para {estado.registrado}. Ya puedes iniciar sesión.
          </p>
        )}
      </div>
      {errorApi && <ErrorBanner mensaje={errorApi} />}
      <form onSubmit={alEnviar} noValidate>
        <FormField id="nombreUsuario" label="Usuario" error={errors.nombreUsuario?.message}>
          {(a11y) => <input type="text" autoComplete="username" {...a11y} {...register('nombreUsuario')} />}
        </FormField>
        <FormField id="password" label="Contraseña" error={errors.password?.message}>
          {(a11y) => (
            <input type="password" autoComplete="current-password" {...a11y} {...register('password')} />
          )}
        </FormField>
        <button type="submit" className="boton" disabled={isSubmitting}>
          {isSubmitting ? 'Ingresando…' : 'Ingresar'}
        </button>
      </form>
      <p className="enlace-aparte">
        ¿No tienes cuenta? <Link to="/registro">Crear cuenta</Link>
      </p>
    </section>
  )
}
