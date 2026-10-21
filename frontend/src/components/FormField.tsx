import type { ReactNode } from 'react'

interface AtributosCampo {
  id: string
  'aria-describedby'?: string
  'aria-invalid'?: boolean
  'aria-required'?: boolean
}

interface Props {
  id: string
  label: string
  error?: string
  hint?: string
  required?: boolean
  children: (atributos: AtributosCampo) => ReactNode
}

// Campo de formulario accesible: etiqueta asociada, ayuda y error vinculados con
// aria-describedby, y el error se anuncia a lectores de pantalla (aria-live).
export function FormField({ id, label, error, hint, required, children }: Props) {
  const idAyuda = `${id}-ayuda`
  const idError = `${id}-error`
  const descritoPor = [hint ? idAyuda : null, error ? idError : null].filter(Boolean).join(' ')

  return (
    <div className="campo">
      <label htmlFor={id}>
        {label}
        {required && <span aria-hidden="true"> *</span>}
      </label>
      {hint && (
        <p id={idAyuda} className="ayuda">
          {hint}
        </p>
      )}
      {children({
        id,
        'aria-describedby': descritoPor || undefined,
        'aria-invalid': error ? true : undefined,
        'aria-required': required ? true : undefined,
      })}
      <div aria-live="polite" className="error-campo">
        {error && (
          <p id={idError}>
            <span aria-hidden="true">⚠ </span>
            {error}
          </p>
        )}
      </div>
    </div>
  )
}
