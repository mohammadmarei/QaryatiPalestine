import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router'
import { Eye, FilePlus2, Pencil, Trash2 } from 'lucide-react'
import type { RecordStatus, Village, VerificationStatus } from '@/types'
import { governorates } from '@/data/governorates'
import { recordStatusLabels, verificationLabels } from '@/i18n/labels'
import { PageHeader } from '@/components/layout/PageHeader'
import { VillagePhoto } from '@/components/brand/VillagePhoto'
import { DataTable, type Column } from '@/components/tables/DataTable'
import { IconAction } from '@/components/tables/IconAction'
import { Select } from '@/components/forms/Fields'
import { RecordStatusBadge, VerificationBadge } from '@/components/ui/Badge'
import { Button, ButtonLink } from '@/components/ui/Button'
import { ConfirmDialog } from '@/components/ui/Dialog'
import { SearchBar } from '@/components/ui/Misc'
import { useAuth } from '@/hooks/useAuth'
import { useData } from '@/hooks/useData'
import { errorMessage } from '@/api/client'
import { useI18n } from '@/hooks/useI18n'
import { useToast } from '@/hooks/useToast'
import { can } from '../auth/permissions'
import { governorateName, matchesVillage } from '../villages/utils'

export function VillagesManagementPage() {
  const { t, pick, formatDate } = useI18n()
  const { villages, users, deleteVillage } = useData()
  const { user } = useAuth()
  const toast = useToast()
  const [params, setParams] = useSearchParams()
  const [gov, setGov] = useState('')
  const [status, setStatus] = useState<RecordStatus | ''>('')
  const [verification, setVerification] = useState<VerificationStatus | ''>('')
  const [toDelete, setToDelete] = useState<Village | null>(null)
  const q = params.get('q') ?? ''
  const canDelete = can.deleteContent(user?.role)

  const setQ = (v: string) => {
    const next = new URLSearchParams(params)
    if (v) next.set('q', v)
    else next.delete('q')
    setParams(next, { replace: true })
  }

  const rows = useMemo(
    () => villages.filter((v) => matchesVillage(v, q) && (!gov || v.governorateId === gov) && (!status || v.status === status) && (!verification || v.verification === verification)),
    [villages, q, gov, status, verification],
  )

  const userName = (id: string) => users.find((u) => u.id === id)?.name ?? '—'

  const columns: Column<Village>[] = [
    {
      key: 'name',
      header: t('Village', 'القرية'),
      sortValue: (v) => pick(v.name),
      cell: (v) => (
        <div className="flex items-center gap-3">
          <VillagePhoto village={v} alt="" className="size-10 shrink-0 rounded-lg" />
          <div className="min-w-0">
            <p className="ar-display text-lg leading-tight font-bold text-forest" lang="ar">
              {v.name.ar}
            </p>
            <p className="truncate text-xs text-muted">{v.name.en}</p>
          </div>
        </div>
      ),
    },
    { key: 'gov', header: t('Governorate', 'المحافظة'), sortValue: (v) => pick(governorateName(v.governorateId)), cell: (v) => pick(governorateName(v.governorateId)) },
    { key: 'status', header: t('Status', 'الحالة'), sortValue: (v) => v.status, cell: (v) => <RecordStatusBadge status={v.status} /> },
    { key: 'verification', header: t('Verification', 'التوثيق'), sortValue: (v) => v.verification, cell: (v) => <VerificationBadge status={v.verification} /> },
    {
      key: 'updated',
      header: t('Last updated', 'آخر تحديث'),
      sortValue: (v) => v.updatedAt,
      cell: (v) => <span className="whitespace-nowrap text-muted">{formatDate(v.updatedAt)}</span>,
    },
    { key: 'by', header: t('Created by', 'أنشأه'), sortValue: (v) => userName(v.createdBy), cell: (v) => <span className="whitespace-nowrap">{userName(v.createdBy)}</span> },
    {
      key: 'actions',
      header: <span className="sr-only">{t('Actions', 'الإجراءات')}</span>,
      className: 'w-0',
      cell: (v) => (
        <div className="flex items-center justify-end gap-0.5">
          <IconAction label={t(`View ${v.name.en}`, `عرض ${v.name.ar}`)} to={`/villages/${v.id}`}>
            <Eye className="size-4" />
          </IconAction>
          <IconAction label={t(`Edit ${v.name.en}`, `تعديل ${v.name.ar}`)} to={`/dashboard/villages/${v.id}/edit`}>
            <Pencil className="size-4" />
          </IconAction>
          {canDelete && (
            <IconAction label={t(`Delete ${v.name.en}`, `حذف ${v.name.ar}`)} onClick={() => setToDelete(v)} tone="danger">
              <Trash2 className="size-4" />
            </IconAction>
          )}
        </div>
      ),
    },
  ]

  const hasFilters = q || gov || status || verification

  return (
    <div>
      <PageHeader
        title={t('Village management', 'إدارة القرى')}
        description={t('Create, edit and curate every village profile in the archive.', 'أنشئ ملفات القرى وعدّلها ونظّمها في الأرشيف.')}
        actions={
          <ButtonLink to="/dashboard/villages/new" icon={<FilePlus2 className="size-4" />}>
            {t('Add village', 'إضافة قرية')}
          </ButtonLink>
        }
      />

      <div className="card overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-stone-line p-4 lg:flex-row lg:items-center">
          <SearchBar value={q} onChange={setQ} placeholder={t('Search by name or spelling…', 'ابحث بالاسم أو طريقة الكتابة…')} className="lg:w-72" />
          <div className="grid flex-1 grid-cols-1 gap-2 sm:grid-cols-3">
            <Select value={gov} onChange={(e) => setGov(e.target.value)} aria-label={t('Governorate', 'المحافظة')} className="h-10">
              <option value="">{t('All governorates', 'جميع المحافظات')}</option>
              {governorates.map((g) => (
                <option key={g.id} value={g.id}>
                  {pick(g.name)}
                </option>
              ))}
            </Select>
            <Select value={status} onChange={(e) => setStatus(e.target.value as RecordStatus | '')} aria-label={t('Status', 'الحالة')} className="h-10">
              <option value="">{t('All statuses', 'جميع الحالات')}</option>
              {(Object.keys(recordStatusLabels) as RecordStatus[]).map((s) => (
                <option key={s} value={s}>
                  {pick(recordStatusLabels[s])}
                </option>
              ))}
            </Select>
            <Select value={verification} onChange={(e) => setVerification(e.target.value as VerificationStatus | '')} aria-label={t('Verification', 'التوثيق')} className="h-10">
              <option value="">{t('Any verification', 'أي حالة توثيق')}</option>
              {(Object.keys(verificationLabels) as VerificationStatus[]).map((s) => (
                <option key={s} value={s}>
                  {pick(verificationLabels[s])}
                </option>
              ))}
            </Select>
          </div>
          {hasFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setQ('')
                setGov('')
                setStatus('')
                setVerification('')
              }}
            >
              {t('Clear', 'مسح')}
            </Button>
          )}
        </div>
        <DataTable
          caption={t('Village records', 'سجلات القرى')}
          rows={rows}
          columns={columns}
          rowKey={(v) => v.id}
          initialSort={{ key: 'updated', dir: 'desc' }}
          resetPageKey={`${q}|${gov}|${status}|${verification}`}
          emptyTitle={t('No villages match', 'لا توجد قرى مطابقة')}
          emptyDescription={t('Try clearing a filter or searching another spelling.', 'جرّب إزالة أحد عوامل التصفية أو البحث بطريقة كتابة أخرى.')}
          emptyAction={
            <ButtonLink to="/dashboard/villages/new" variant="outline" icon={<FilePlus2 className="size-4" />}>
              {t('Add village', 'إضافة قرية')}
            </ButtonLink>
          }
        />
      </div>

      <ConfirmDialog
        open={!!toDelete}
        onClose={() => setToDelete(null)}
        title={t('Delete this village?', 'حذف هذه القرية؟')}
        description={
          toDelete
            ? t(
                `“${toDelete.name.en}” and its population records will be removed. Only admins can delete.`,
                `سيُحذف ملف «${toDelete.name.ar}» وسجلاته السكانية. الحذف للمشرفين فقط.`,
              )
            : undefined
        }
        confirmLabel={t('Delete village', 'حذف القرية')}
        onConfirm={async () => {
          if (!toDelete) return
          try {
            await deleteVillage(toDelete.id)
            toast.success(t('Village deleted', 'تم حذف القرية'), t('Its records were removed first; every removal is in the audit log.', 'حُذفت سجلاتها أولًا، وكل حذف مسجّل في سجل التغييرات.'))
          } catch (error) {
            toast.error(t('The village was not deleted', 'لم تُحذف القرية'), errorMessage(error))
          }
        }}
      />
    </div>
  )
}
