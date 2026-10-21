import type { ReactNode } from 'react'

// Encabezado principal de cada página. Es enfocable por código (tabIndex -1)
// para poder mover el foco aquí al cambiar de ruta.
export function PageHeading({ children }: { children: ReactNode }) {
  return (
    <h1 tabIndex={-1} className="titulo-pagina">
      {children}
    </h1>
  )
}
