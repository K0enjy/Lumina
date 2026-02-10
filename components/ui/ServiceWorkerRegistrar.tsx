'use client'

import { useEffect } from 'react'

export function ServiceWorkerRegistrar() {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return

    let registration: ServiceWorkerRegistration | undefined

    navigator.serviceWorker
      .register('/sw.js')
      .then((reg) => {
        registration = reg
      })
      .catch((error) => {
        console.error('Service worker registration failed:', error)
      })

    const handleControllerChange = () => {
      window.location.reload()
    }

    navigator.serviceWorker.addEventListener(
      'controllerchange',
      handleControllerChange
    )

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && registration) {
        registration.update().catch((error) => {
          console.error('Service worker update check failed:', error)
        })
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      navigator.serviceWorker.removeEventListener(
        'controllerchange',
        handleControllerChange
      )
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [])

  return null
}
