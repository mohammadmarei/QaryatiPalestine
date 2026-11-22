import { LogoMark } from '../brand/Motifs'

export function PageLoader() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center" role="status" aria-live="polite">
      <div className="flex flex-col items-center gap-3">
        <LogoMark className="size-10 animate-pulse" />
        <span className="sr-only">Loading…</span>
      </div>
    </div>
  )
}
