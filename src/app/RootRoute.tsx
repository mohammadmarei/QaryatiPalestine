import { useEffect } from 'react'
import { Outlet, useLocation } from 'react-router'

/** Scrolls to the top on navigation, or to the `#hash` target when present. */
export function RootRoute() {
  const { pathname, hash } = useLocation()

  useEffect(() => {
    if (hash) {
      // Wait a frame so lazily-loaded pages have rendered their anchors.
      const id = window.setTimeout(() => document.getElementById(hash.slice(1))?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 120)
      return () => window.clearTimeout(id)
    }
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior })
  }, [pathname, hash])

  return <Outlet />
}
