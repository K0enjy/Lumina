import { Window } from 'happy-dom'

const window = new Window({ url: 'http://localhost:3000' })

// Register all DOM globals onto globalThis
const globals = [
  'document',
  'window',
  'navigator',
  'HTMLElement',
  'HTMLDivElement',
  'HTMLInputElement',
  'HTMLButtonElement',
  'HTMLFormElement',
  'HTMLAnchorElement',
  'HTMLSpanElement',
  'HTMLHeadingElement',
  'HTMLParagraphElement',
  'Element',
  'Node',
  'Text',
  'Event',
  'MouseEvent',
  'KeyboardEvent',
  'InputEvent',
  'CustomEvent',
  'MutationObserver',
  'DocumentFragment',
  'DOMParser',
  'XMLSerializer',
  'getComputedStyle',
  'requestAnimationFrame',
  'cancelAnimationFrame',
  'setTimeout',
  'clearTimeout',
  'setInterval',
  'clearInterval',
  'SVGElement',
  'HTMLCollection',
  'NodeList',
] as const

for (const key of globals) {
  if (key in window && !(key in globalThis)) {
    Object.defineProperty(globalThis, key, {
      value: (window as Record<string, unknown>)[key],
      writable: true,
      configurable: true,
    })
  }
}

// Ensure window is also set
if (!('window' in globalThis)) {
  Object.defineProperty(globalThis, 'window', {
    value: window,
    writable: true,
    configurable: true,
  })
}

// Ensure document is also set
if (!('document' in globalThis)) {
  Object.defineProperty(globalThis, 'document', {
    value: window.document,
    writable: true,
    configurable: true,
  })
}
