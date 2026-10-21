interface Props {
  pagina: number
  totalPaginas: number
  onCambiar: (pagina: number) => void
}

export function Pagination({ pagina, totalPaginas, onCambiar }: Props) {
  return (
    <nav aria-label="Paginación" className="paginacion">
      <button
        type="button"
        className="boton boton-secundario"
        disabled={pagina <= 1}
        onClick={() => onCambiar(pagina - 1)}
      >
        Anterior
      </button>
      <p aria-live="polite">
        Página {pagina} de {totalPaginas}
      </p>
      <button
        type="button"
        className="boton boton-secundario"
        disabled={pagina >= totalPaginas}
        onClick={() => onCambiar(pagina + 1)}
      >
        Siguiente
      </button>
    </nav>
  )
}
