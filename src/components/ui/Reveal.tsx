import type { ElementType, ReactNode } from 'react'
import { useInView } from '@/hooks/useInView'
import { cn } from '@/utils/cn'

/** Gently fades content up when it first scrolls into view. */
export function Reveal({
  children,
  className,
  delay = 0,
  as: Tag = 'div',
}: {
  children: ReactNode
  className?: string
  delay?: number
  as?: ElementType
}) {
  const { ref, inView } = useInView<HTMLDivElement>()
  return (
    <Tag ref={ref} className={cn('reveal', inView && 'is-visible', className)} style={{ transitionDelay: `${delay}ms` }}>
      {children}
    </Tag>
  )
}
