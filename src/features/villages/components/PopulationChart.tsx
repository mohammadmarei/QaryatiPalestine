import { Area, CartesianGrid, ComposedChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { PopulationRecord } from '@/types'
import { populationKindLabels } from '@/i18n/labels'
import { useI18n } from '@/hooks/useI18n'

interface Row {
  year: number
  label: string
  record: PopulationRecord
  /** Value for the solid (counted) series. */
  counted?: number
  /** Value for the dashed (estimated) series. */
  estimated?: number
}

/**
 * Emerald area for counted figures (census, survey) and a dashed gold line
 * for estimates, joined at the last counted point so the series reads as one.
 */
export function PopulationChart({ records, height = 280 }: { records: PopulationRecord[]; height?: number }) {
  const { isRtl, formatNumber, pick, t } = useI18n()
  const sorted = [...records].sort((a, b) => a.year - b.year)

  if (sorted.length === 0) {
    return <p className="py-10 text-center text-sm text-muted">{t('No population records yet.', 'لا توجد سجلات سكانية بعد.')}</p>
  }

  // An estimate is drawn as a dashed segment from the record just before it.
  const data: Row[] = sorted.map((r, i) => {
    const next = sorted[i + 1]
    const isEstimate = r.kind === 'estimate'
    return {
      year: r.year,
      label: String(r.year),
      record: r,
      counted: isEstimate ? undefined : r.population,
      estimated: isEstimate || next?.kind === 'estimate' ? r.population : undefined,
    }
  })

  return (
    <div style={{ height }} dir="ltr">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 10, right: 10, left: 4, bottom: 0 }}>
          <defs>
            <linearGradient id="pop-area" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10B981" stopOpacity={0.23} />
              <stop offset="100%" stopColor="#10B981" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} stroke="#E2E8F0" />
          <XAxis dataKey="label" reversed={isRtl} tickLine={false} axisLine={{ stroke: '#E2E8F0' }} tick={{ fill: '#64748B', fontSize: 12 }} />
          <YAxis
            orientation={isRtl ? 'right' : 'left'}
            tickLine={false}
            axisLine={false}
            width={52}
            tick={{ fill: '#64748B', fontSize: 12 }}
            tickFormatter={(v: number) => formatNumber(v)}
          />
          <Tooltip
            cursor={{ stroke: '#B7E2D0' }}
            content={({ active, payload }) => {
              const row = payload?.[0]?.payload as Row | undefined
              if (!active || !row) return null
              return (
                <div className="rounded-xl border border-stone-line bg-white px-3 py-2 text-sm shadow-lift" dir={isRtl ? 'rtl' : 'ltr'}>
                  <p className="font-latin font-bold text-forest">{row.year}</p>
                  <p className="text-ink">{formatNumber(row.record.population)}</p>
                  <p className="text-xs text-muted">{pick(populationKindLabels[row.record.kind])}</p>
                </div>
              )
            }}
          />
          <Area type="monotone" dataKey="counted" stroke="#10B981" strokeWidth={2} fill="url(#pop-area)" connectNulls dot={{ r: 3.5, fill: '#fff', stroke: '#10B981', strokeWidth: 1.5 }} activeDot={{ r: 5 }} animationDuration={900} />
          <Line type="monotone" dataKey="estimated" stroke="#D6B46A" strokeWidth={2} strokeDasharray="5 4" dot={{ r: 3.5, fill: '#fff', stroke: '#D6B46A', strokeWidth: 1.5 }} activeDot={{ r: 5 }} animationDuration={900} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}

export function PopulationLegend() {
  const { t } = useI18n()
  return (
    <ul className="flex flex-wrap gap-x-5 gap-y-2 text-xs text-muted">
      <li className="flex items-center gap-2">
        <span className="h-0.5 w-5 rounded bg-accent" /> {t('Census / survey', 'تعداد / مسح')}
      </li>
      <li className="flex items-center gap-2">
        <span className="h-0 w-5 border-t-2 border-dashed border-gold" /> {t('Estimate / projection', 'تقدير / إسقاط')}
      </li>
    </ul>
  )
}
