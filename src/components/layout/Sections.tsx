import type { ReactNode } from 'react'
import { cn, container } from '@/utils/cn'
import { Breadcrumbs, type Crumb } from '../ui/Misc'

/** Eyebrow + title + supporting text, with an optional action aligned to the end. */
export function SectionHeading({ eyebrow, title, body, action, id, className }: { eyebrow?: string; title: string; body?: ReactNode; action?: ReactNode; id?: string; className?: string }) {
  return (
    <div className={cn('mb-9 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between', className)}>
      <div>
        {eyebrow && <span className="mb-2.5 block text-xs font-extrabold tracking-[0.08em] text-accent-dark uppercase">{eyebrow}</span>}
        <h2 id={id} className="text-[28px] leading-tight font-bold text-forest sm:text-[34px]">
          {title}
        </h2>
        {body && <p className="mt-2 text-muted">{body}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  )
}

/** Forest-green band that opens inner public pages. */
export function PageHero({ eyebrow, title, body, crumbs, children }: { eyebrow?: string; title: string; body?: ReactNode; crumbs?: Crumb[]; children?: ReactNode }) {
  return (
    <section className="relative overflow-hidden bg-forest py-14 text-white sm:py-[72px]">
      <div className="pointer-events-none absolute inset-0 bg-dots-light [mask-image:linear-gradient(to_left,#000,transparent_60%)] rtl:[mask-image:linear-gradient(to_right,#000,transparent_60%)]" aria-hidden />
      <div className={cn(container, 'relative')}>
        {crumbs && <Breadcrumbs tone="light" items={crumbs} className="mb-6" />}
        {eyebrow && <span className="mb-2.5 block text-xs font-extrabold tracking-[0.08em] text-gold uppercase">{eyebrow}</span>}
        <h1 className="text-3xl font-bold sm:text-[42px] sm:leading-tight">{title}</h1>
        {body && <p className="mt-2.5 max-w-2xl text-[#c3d1ce]">{body}</p>}
        {children}
      </div>
    </section>
  )
}
