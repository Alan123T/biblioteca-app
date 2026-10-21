import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterAll, afterEach, beforeAll } from 'vitest'
import { reiniciarDatos } from './handlers'
import { server } from './server'

// jsdom no implementa showModal/close del elemento <dialog>.
if (typeof HTMLDialogElement !== 'undefined' && !HTMLDialogElement.prototype.showModal) {
  HTMLDialogElement.prototype.showModal = function showModal() {
    this.setAttribute('open', '')
  }
  HTMLDialogElement.prototype.close = function close() {
    this.removeAttribute('open')
  }
}

// axe-core intenta usar canvas para medir íconos; jsdom no lo implementa.
HTMLCanvasElement.prototype.getContext = () => null

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))

afterEach(() => {
  cleanup()
  server.resetHandlers()
  reiniciarDatos()
  sessionStorage.clear()
})

afterAll(() => server.close())
