import { Link } from 'react-router'
import { cn } from '@/utils/cn'
import { LogoMark } from './Motifs'

export function Logo({ inverted = false, className, to = '/' }: { inverted?: boolean; className?: string; to?: string }) {
  return (
    <Link to={to} className={cn('inline-flex items-center gap-2.5', className)} aria-label="Qaryati — قريتي">
      <LogoMark className="size-[42px]" inverted={inverted} />
      <span className="flex flex-col leading-none">
        <span className={cn('font-arabic text-xl leading-tight font-bold tracking-tight', inverted ? 'text-white' : 'text-forest')}>قريتي</span>
        <span className="font-latin text-[8px] font-semibold tracking-[0.3em] text-sage">QARYATI</span>
      </span>
    </Link>
  )
}
