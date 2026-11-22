import type { ReactNode } from 'react'
import { BadgeCheck, CircleDashed, Clock, FileEdit, AlertTriangle, Archive, CheckCircle2, XCircle, MessageSquareWarning } from 'lucide-react'
import type { RecordStatus, ReviewStatus, VerificationStatus } from '@/types'
import { recordStatusLabels, reviewStatusLabels, verificationLabels } from '@/i18n/labels'
import { useI18n } from '@/hooks/useI18n'
import { cn } from '@/utils/cn'

export type BadgeTone = 'olive' | 'gold' | 'accent' | 'amber' | 'neutral' | 'forest' | 'red'

const tones: Record<BadgeTone, string> = {
  olive: 'bg-olive-50 text-olive-600 ring-olive-200',
  gold: 'bg-gold-50 text-[#8a6d33] ring-gold/40',
  accent: 'bg-accent-50 text-accent-dark ring-accent/25',
  amber: 'bg-[#fff7ed] text-[#b45309] ring-[#fdba74]/50',
  neutral: 'bg-beige text-muted ring-stone-line',
  forest: 'bg-forest text-limestone ring-forest',
  red: 'bg-danger-50 text-danger ring-danger/20',
}

export function Badge({ tone = 'neutral', children, className, icon }: { tone?: BadgeTone; children: ReactNode; className?: string; icon?: ReactNode }) {
  return (
    <span className={cn('inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset', tones[tone], className)}>
      {icon}
      {children}
    </span>
  )
}

const verificationMeta: Record<VerificationStatus, { tone: BadgeTone; icon: typeof BadgeCheck }> = {
  verified: { tone: 'olive', icon: BadgeCheck },
  pending: { tone: 'gold', icon: Clock },
  unverified: { tone: 'neutral', icon: CircleDashed },
  'needs-review': { tone: 'amber', icon: AlertTriangle },
}

export function VerificationBadge({ status, className }: { status: VerificationStatus; className?: string }) {
  const { pick } = useI18n()
  const m = verificationMeta[status]
  const Icon = m.icon
  return (
    <Badge tone={m.tone} className={className} icon={<Icon className="size-3.5" aria-hidden />}>
      {pick(verificationLabels[status])}
    </Badge>
  )
}

const recordMeta: Record<RecordStatus, { tone: BadgeTone; icon: typeof BadgeCheck }> = {
  published: { tone: 'forest', icon: CheckCircle2 },
  draft: { tone: 'neutral', icon: FileEdit },
  pending: { tone: 'gold', icon: Clock },
  archived: { tone: 'neutral', icon: Archive },
}

export function RecordStatusBadge({ status }: { status: RecordStatus }) {
  const { pick } = useI18n()
  const m = recordMeta[status]
  const Icon = m.icon
  return (
    <Badge tone={m.tone} icon={<Icon className="size-3.5" aria-hidden />}>
      {pick(recordStatusLabels[status])}
    </Badge>
  )
}

const reviewMeta: Record<ReviewStatus, { tone: BadgeTone; icon: typeof BadgeCheck }> = {
  pending: { tone: 'gold', icon: Clock },
  approved: { tone: 'olive', icon: CheckCircle2 },
  rejected: { tone: 'red', icon: XCircle },
  'changes-requested': { tone: 'amber', icon: MessageSquareWarning },
}

export function ReviewStatusBadge({ status }: { status: ReviewStatus }) {
  const { pick } = useI18n()
  const m = reviewMeta[status]
  const Icon = m.icon
  return (
    <Badge tone={m.tone} icon={<Icon className="size-3.5" aria-hidden />}>
      {pick(reviewStatusLabels[status])}
    </Badge>
  )
}
