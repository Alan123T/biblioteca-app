interface Props {
  mensaje: string
  onReintentar?: () => void
}

export function ErrorBanner({ mensaje, onReintentar }: Props) {
  return (
    <div role="alert" className="aviso aviso-error">
      <p>
        <span aria-hidden="true">⚠ </span>
        <strong>Error:</strong> {mensaje}
      </p>
      {onReintentar && (
        <button type="button" className="boton boton-secundario" onClick={onReintentar}>
          Reintentar
        </button>
      )}
    </div>
  )
}
