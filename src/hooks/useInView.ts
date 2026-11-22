import { useEffect, useRef, useState } from 'react'

/** True once the element has scrolled into view (fires once). */
export function useInView<T extends Element>(options: IntersectionObserverInit = { rootMargin: '0px 0px -10% 0px' }) {
  const ref = useRef<T | null>(null)
  const [inView, setInView] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el || inView) return
    const obs = new IntersectionObserver(([entry]) => {
      if (entry?.isIntersecting) {
        setInView(true)
        obs.disconnect()
      }
    }, options)
    obs.observe(el)
    return () => obs.disconnect()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inView])

  return { ref, inView }
}
