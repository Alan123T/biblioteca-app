export function Cargando({ texto }: { texto: string }) {
  return (
    <p role="status" className="estado">
      {texto}
    </p>
  )
}
