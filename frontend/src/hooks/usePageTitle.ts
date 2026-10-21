import { useEffect } from 'react'

export function usePageTitle(titulo: string): void {
  useEffect(() => {
    document.title = `${titulo} | Biblioteca`
  }, [titulo])
}
