import { useMemo, useState } from 'react'
import { Download, FileClock } from 'lucide-react'
import type { AuditAction, AuditLog } from '@/types'
import { auditActionLabels, auditEntityLabels } from '@/i18n/labels'
import { RestrictedState } from '@/components/feedback/States'
import { PageHeader } from '@/components/layout/PageHeader'
import { DataTable, type Column } from '@/components/tables/DataTable'
import { DateInput, Select } from '@/components/forms/Fields'
import { Badge, type BadgeTone } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Avatar, Chip, SearchBar } from '@/components/ui/Misc'
import { useAuth } from '@/hooks/useAuth'
import { useData } from '@/hooks/useData'
import { useI18n } from '@/hooks/useI18n'
import { useToast } from '@/hooks/useToast'
import { normalizeSearch } from '@/utils/misc'
import { can } from '../auth/permissions'

const actionTone: Record<AuditAction, BadgeTone> = {
  create: 'olive',
  update: 'neutral',
  delete: 'red',
  approve: 'olive',
  reject: 'amber',
  login: 'neutral',
  publish: 'forest',
  'role-change': 'gold',
}

export function AuditLogsPage() {
  const { t, pick, formatDate } = useI18n()
  const { auditLogs, users } = useData()
  const { user } = useAuth()
  const toast = useToast()
  const [q, setQ] = useState('')
  const [userId, setUserId] = useState('')
  const [action, setAction] = useState<AuditAction | ''>('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')

  const userName = (id: string) => users.find((u) => u.id === id)?.name ?? id

  const rows = useMemo(() => {
    const needle = normalizeSearch(q)
    return auditLogs.filter((l) => {
      const day = l.at.slice(0, 10)
      return (
        (!userId || l.userId === userId) &&
        (!action || l.action === action) &&
        (!from || day >= from) &&
        (!to || day <= to) &&
        (!needle || normalizeSearch(`${l.entityLabel} ${l.details}`).includes(needle))
      )
    })
  }, [auditLogs, userId, action, from, to, q])

  const exportCsv = () => {
    const header = ['time', 'user', 'action', 'entity_type', 'entity', 'details']
    const lines = rows.map((l) => [l.at, userName(l.userId), l.action, l.entityType, l.entityLabel, l.details].map((c) => `"${String(c).replace(/"/g, '""')}"`).join(','))
    const blob = new Blob([[header.join(','), ...lines].join('\n')], { type: 'text/csv;charset=utf-8' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = 'qaryati-audit-log.csv'
    a.click()
    URL.revokeObjectURL(a.href)
    toast.success(t('CSV exported', 'تم تصدير الملف'), t(`${rows.length} rows downloaded from local data.`, `تم تنزيل ${rows.length} سطرًا من البيانات المحلية.`))
  }

  const columns: Column<AuditLog>[] = [
    {
      key: 'at',
      header: t('Date & time', 'التاريخ والوقت'),
      sortValue: (l) => l.at,
      cell: (l) => (
        <div className="whitespace-nowrap">
          <p className="text-ink">{formatDate(l.at)}</p>
          <p className="text-xs text-muted" dir="ltr">
            {formatDate(l.at, { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
      ),
    },
    {
      key: 'user',
      header: t('User', 'المستخدم'),
      sortValue: (l) => userName(l.userId),
      cell: (l) => (
        <span className="flex items-center gap-2 whitespace-nowrap">
          <Avatar name={userName(l.userId)} size="sm" />
          {userName(l.userId)}
        </span>
      ),
    },
    { key: 'action', header: t('Action', 'الإجراء'), sortValue: (l) => l.action, cell: (l) => <Badge tone={actionTone[l.action]}>{pick(auditActionLabels[l.action])}</Badge> },
    {
      key: 'entity',
      header: t('Affected entity', 'العنصر المتأثر'),
      sortValue: (l) => l.entityLabel,
      cell: (l) => (
        <div>
          <p className="font-medium text-ink" dir="auto">
            {l.entityLabel}
          </p>
          <p className="text-xs text-muted">{pick(auditEntityLabels[l.entityType])}</p>
        </div>
      ),
    },
    {
      key: 'details',
      header: t('Details', 'التفاصيل'),
      cell: (l) => (
        <div className="max-w-xs">
          <p className="text-ink/80" dir="auto">
            {l.details}
          </p>
          <p className="font-mono text-[0.68rem] text-muted" dir="ltr">
            IP {l.ip}
          </p>
        </div>
      ),
    },
  ]

  const active = [
    userId && { k: 'user', label: userName(userId), clear: () => setUserId('') },
    action && { k: 'action', label: pick(auditActionLabels[action]), clear: () => setAction('') },
    from && { k: 'from', label: `${t('From', 'من')} ${from}`, clear: () => setFrom('') },
    to && { k: 'to', label: `${t('To', 'إلى')} ${to}`, clear: () => setTo('') },
  ].filter(Boolean) as { k: string; label: string; clear: () => void }[]

  const allowed = can.viewAuditLogs(user?.role)

  return (
    <div>
      <PageHeader
        title={t('Audit logs', 'سجل النشاط')}
        description={t('A chronological record of every change made in the workspace.', 'سجل زمني لكل تغيير يحدث في مساحة العمل.')}
        actions={
          allowed && (
            <Button variant="outline" icon={<Download className="size-4" />} onClick={exportCsv} disabled={rows.length === 0}>
              {t('Export CSV', 'تصدير CSV')}
            </Button>
          )
        }
      />
      {!allowed ? (
        <RestrictedState />
      ) : (
        <>
          <div className="card overflow-hidden">
            <div className="grid gap-3 border-b border-stone-line p-4 md:grid-cols-2 xl:grid-cols-[1.3fr_1fr_1fr_0.9fr_0.9fr]">
              <SearchBar value={q} onChange={setQ} placeholder={t('Search entity or details…', 'ابحث في العنصر أو التفاصيل…')} />
              <Select value={userId} onChange={(e) => setUserId(e.target.value)} aria-label={t('Filter by user', 'التصفية حسب المستخدم')} className="h-10">
                <option value="">{t('All users', 'جميع المستخدمين')}</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </Select>
              <Select value={action} onChange={(e) => setAction(e.target.value as AuditAction | '')} aria-label={t('Filter by action', 'التصفية حسب الإجراء')} className="h-10">
                <option value="">{t('All actions', 'جميع الإجراءات')}</option>
                {(Object.keys(auditActionLabels) as AuditAction[]).map((a) => (
                  <option key={a} value={a}>
                    {pick(auditActionLabels[a])}
                  </option>
                ))}
              </Select>
              <DateInput value={from} onChange={(e) => setFrom(e.target.value)} aria-label={t('From date', 'من تاريخ')} className="h-10" max={to || undefined} />
              <DateInput value={to} onChange={(e) => setTo(e.target.value)} aria-label={t('To date', 'إلى تاريخ')} className="h-10" min={from || undefined} />
            </div>
            {active.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 border-b border-stone-line px-4 py-3">
                {active.map((a) => (
                  <Chip key={a.k} onRemove={a.clear}>
                    {a.label}
                  </Chip>
                ))}
              </div>
            )}
            <DataTable
              caption={t('Audit log', 'سجل النشاط')}
              rows={rows}
              columns={columns}
              rowKey={(l) => l.id}
              pageSize={12}
              initialSort={{ key: 'at', dir: 'desc' }}
              resetPageKey={`${q}|${userId}|${action}|${from}|${to}`}
              emptyTitle={t('No activity in this range', 'لا يوجد نشاط في هذا النطاق')}
              emptyDescription={t('Widen the date range or clear a filter.', 'وسّع نطاق التاريخ أو أزل أحد عوامل التصفية.')}
            />
          </div>
          <p className="mt-4 flex items-center gap-2 text-xs text-muted">
            <FileClock className="size-3.5" />
            {t('Every create, update, delete and review decision is recorded by the server.', 'يسجّل الخادم كل عملية إضافة وتعديل وحذف وقرار مراجعة.')}
          </p>
        </>
      )}
    </div>
  )
}
