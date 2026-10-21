import { useEffect, useId, useRef } from 'react'

interface Props {
  abierto: boolean
  titulo: string
  descripcion: string
  textoConfirmar: string
  cargando?: boolean
  error?: string
  onConfirmar: () => void
  onCancelar: () => void
}

// Diálogo modal con el elemento <dialog> nativo: el navegador atrapa el foco dentro,
// se cierra con Escape y devuelve el foco al botón que lo abrió.
// El foco inicial queda en "Cancelar" (primer botón) porque la acción es destructiva.
export function ConfirmDialog({
  abierto,
  titulo,
  descripcion,
  textoConfirmar,
  cargando,
  error,
  onConfirmar,
  onCancelar,
}: Props) {
  const dialogo = useRef<HTMLDialogElement>(null)
  const idTitulo = useId()
  const idDescripcion = useId()

  useEffect(() => {
    const elemento = dialogo.current
    if (!elemento) return
    if (abierto && !elemento.open) elemento.showModal()
    if (!abierto && elemento.open) elemento.close()
  }, [abierto])

  return (
    <dialog
      ref={dialogo}
      className="dialogo"
      aria-labelledby={idTitulo}
      aria-describedby={idDescripcion}
      onCancel={(evento) => {
        evento.preventDefault()
        onCancelar()
      }}
    >
      <h2 id={idTitulo}>{titulo}</h2>
      <p id={idDescripcion}>{descripcion}</p>
      {error && (
        <p role="alert" className="aviso aviso-error">
          <span aria-hidden="true">⚠ </span>
          <strong>Error:</strong> {error}
        </p>
      )}
      <div className="acciones">
        <button type="button" className="boton boton-secundario" onClick={onCancelar}>
          Cancelar
        </button>
        <button type="button" className="boton boton-peligro" onClick={onConfirmar} disabled={cargando}>
          {cargando ? 'Eliminando…' : textoConfirmar}
        </button>
      </div>
    </dialog>
  )
}
