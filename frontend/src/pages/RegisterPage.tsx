import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link, useNavigate } from 'react-router-dom'
import { ApiError } from '../api/errors'
import { ErrorBanner } from '../components/ErrorBanner'
import { FormField } from '../components/FormField'
import { PageHeading } from '../components/PageHeading'
import { usePageTitle } from '../hooks/usePageTitle'
import { registrar } from '../services/authService'

const esquema = z
  .object({
    nombreUsuario: z
      .string()
      .trim()
      .min(3, 'El usuario debe tener al menos 3 caracteres')
      .max(50, 'El usuario no puede superar 50 caracteres'),
    password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
    confirmar: z.string().min(1, 'Repite la contraseña'),
  })
  .refine((datos) => datos.password === datos.confirmar, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmar'],
  })
type DatosRegistro = z.infer<typeof esquema>

export function RegisterPage() {
  usePageTitle('Crear cuenta')
  const navegar = useNavigate()
  const [errorApi, setErrorApi] = useState<string>()
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<DatosRegistro>({ resolver: zodResolver(esquema) })

  const alEnviar = handleSubmit(async (datos) => {
    setErrorApi(undefined)
    try {
      await registrar(datos.nombreUsuario, datos.password)
      navegar('/login', { replace: true, state: { registrado: datos.nombreUsuario } })
    } catch (error) {
      setErrorApi(error instanceof ApiError ? error.message : 'No se pudo crear la cuenta.')
    }
  })

  return (
    <section className="panel panel-angosto">
      <PageHeading>Crear cuenta</PageHeading>
      <p className="ayuda">Los campos marcados con * son obligatorios. Las cuentas nuevas tienen rol Lector.</p>
      {errorApi && <ErrorBanner mensaje={errorApi} />}
      <form onSubmit={alEnviar} noValidate>
        <FormField id="nombreUsuario" label="Usuario" required error={errors.nombreUsuario?.message} hint="Entre 3 y 50 caracteres.">
          {(a11y) => <input type="text" autoComplete="username" {...a11y} {...register('nombreUsuario')} />}
        </FormField>
        <FormField id="password" label="Contraseña" required error={errors.password?.message} hint="Mínimo 8 caracteres.">
          {(a11y) => <input type="password" autoComplete="new-password" {...a11y} {...register('password')} />}
        </FormField>
        <FormField id="confirmar" label="Repetir contraseña" required error={errors.confirmar?.message}>
          {(a11y) => <input type="password" autoComplete="new-password" {...a11y} {...register('confirmar')} />}
        </FormField>
        <button type="submit" className="boton" disabled={isSubmitting}>
          {isSubmitting ? 'Creando cuenta…' : 'Crear cuenta'}
        </button>
      </form>
      <p className="enlace-aparte">
        ¿Ya tienes cuenta? <Link to="/login">Iniciar sesión</Link>
      </p>
    </section>
  )
}
