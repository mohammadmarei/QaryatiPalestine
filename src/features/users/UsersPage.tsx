import { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ArrowRight, Pencil, ShieldCheck, UserCheck, UserX, Users as UsersIcon } from 'lucide-react'
import type { Role, User } from '@/types'
import { roleLabels } from '@/i18n/labels'
import { RestrictedState } from '@/components/feedback/States'
import { PageHeader } from '@/components/layout/PageHeader'
import { DataTable, type Column } from '@/components/tables/DataTable'
import { IconAction } from '@/components/tables/IconAction'
import { Field, Input, Select, Switch } from '@/components/forms/Fields'
import { Badge, type BadgeTone } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { ConfirmDialog, Dialog } from '@/components/ui/Dialog'
import { Avatar, SearchBar } from '@/components/ui/Misc'
import { StatCard } from '@/components/ui/StatCard'
import { useAuth } from '@/hooks/useAuth'
import { useData } from '@/hooks/useData'
import { errorMessage } from '@/api/client'
import { useI18n } from '@/hooks/useI18n'
import { useToast } from '@/hooks/useToast'
import { normalizeSearch } from '@/utils/misc'
import { can } from '../auth/permissions'

const roles = Object.keys(roleLabels) as Role[]
const roleTone: Record<Role, BadgeTone> = { admin: 'forest', editor: 'olive', reviewer: 'gold', contributor: 'neutral' }

function EditUserDialog({ user, onClose, isSelf }: { user: User | null; onClose: () => void; isSelf: boolean }) {
  const { t, pick } = useI18n()
  const { updateUser } = useData()
  const toast = useToast()
  const schema = z.object({
    name: z.string().trim().min(3, t('Name is required', 'الاسم مطلوب')),
    organization: z.string().trim(),
    role: z.enum(['admin', 'editor', 'reviewer', 'contributor']),
    active: z.boolean(),
  })
  type Values = z.infer<typeof schema>
  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<Values>({ resolver: zodResolver(schema) })

  // Role and status changes get an explicit confirmation step before saving.
  const [pending, setPending] = useState<Values | null>(null)
  const [lastUser, setLastUser] = useState(user)
  if (user !== lastUser) {
    setLastUser(user)
    setPending(null)
  }

  useEffect(() => {
    if (user) reset({ name: user.name, organization: user.organization ?? '', role: user.role, active: user.active })
  }, [user, reset])

  const apply = async (v: Values) => {
    if (!user) return
    try {
      await updateUser(user.id, { name: v.name, organization: v.organization || undefined, role: v.role, active: v.active })
    } catch (error) {
      toast.error(t('The user was not updated', 'لم يُحدَّث المستخدم'), errorMessage(error))
      return
    }
    toast.success(t('User updated', 'تم تحديث المستخدم'), v.role !== user.role ? t(`Role changed to ${roleLabels[v.role].en}.`, `تم تغيير الدور إلى ${roleLabels[v.role].ar}.`) : undefined)
    onClose()
  }

  const onSubmit = (v: Values) => {
    if (!user) return
    if (v.role !== user.role || v.active !== user.active) setPending(v)
    else apply(v)
  }

  const role = watch('role')
  const roleHelp: Record<Role, string> = {
    admin: t('Full access, including users and settings.', 'صلاحيات كاملة تشمل المستخدمين والإعدادات.'),
    editor: t('Create, edit and publish village content.', 'إنشاء محتوى القرى وتعديله ونشره.'),
    reviewer: t('Approve or reject submissions.', 'قبول المساهمات أو رفضها.'),
    contributor: t('Submit content for review.', 'إرسال المحتوى للمراجعة.'),
  }

  return (
    <Dialog
      open={!!user}
      onClose={onClose}
      title={pending ? t('Confirm account changes', 'تأكيد تغييرات الحساب') : t('Edit user', 'تعديل المستخدم')}
      description={user?.email}
      footer={
        pending ? (
          <>
            <Button variant="outline" onClick={() => setPending(null)}>
              {t('Back', 'رجوع')}
            </Button>
            <Button variant={pending.active ? 'primary' : 'danger'} onClick={() => apply(pending)}>
              {t('Confirm changes', 'تأكيد التغييرات')}
            </Button>
          </>
        ) : (
          <>
            <Button variant="outline" onClick={onClose}>
              {t('Cancel', 'إلغاء')}
            </Button>
            <Button type="submit" form="user-form">
              {t('Save changes', 'حفظ التغييرات')}
            </Button>
          </>
        )
      }
    >
      {pending && user && (
        <div className="space-y-3 pb-2" role="status">
          <p className="text-sm text-ink/80">{t(`These changes affect what ${user.name} can do in the workspace.`, `تؤثر هذه التغييرات على ما يستطيع ${user.name} فعله في مساحة العمل.`)}</p>
          <dl className="space-y-2 rounded-2xl bg-paper p-4 text-sm">
            {pending.role !== user.role && (
              <div className="flex flex-wrap items-center justify-between gap-2">
                <dt className="text-muted">{t('Role', 'الدور')}</dt>
                <dd className="flex items-center gap-1.5">
                  <Badge tone={roleTone[user.role]}>{pick(roleLabels[user.role])}</Badge>
                  <ArrowRight className="size-3.5 text-muted rtl:rotate-180" aria-label={t('to', 'إلى')} />
                  <Badge tone={roleTone[pending.role]}>{pick(roleLabels[pending.role])}</Badge>
                </dd>
              </div>
            )}
            {pending.active !== user.active && (
              <div className="flex flex-wrap items-center justify-between gap-2">
                <dt className="text-muted">{t('Account status', 'حالة الحساب')}</dt>
                <dd className="font-medium">{pending.active ? t('Will be activated', 'سيُفعَّل') : t('Will be deactivated', 'سيُوقَف')}</dd>
              </div>
            )}
          </dl>
        </div>
      )}
      <form id="user-form" onSubmit={handleSubmit(onSubmit)} noValidate className={pending ? 'hidden' : 'space-y-4 pb-2'}>
        <Field label={t('Full name', 'الاسم الكامل')} required error={errors.name?.message}>
          {(id, d) => <Input id={id} aria-describedby={d} invalid={!!errors.name} {...register('name')} />}
        </Field>
        <Field label={t('Organization', 'الجهة')}>
          {(id) => <Input id={id} {...register('organization')} />}
        </Field>
        <Field label={t('Role', 'الدور')} hint={role ? roleHelp[role] : undefined}>
          {(id, d) => (
            <Select id={id} aria-describedby={d} disabled={isSelf} {...register('role')}>
              {roles.map((r) => (
                <option key={r} value={r}>
                  {pick(roleLabels[r])}
                </option>
              ))}
            </Select>
          )}
        </Field>
        {isSelf && <p className="text-xs text-muted">{t('You cannot change your own role or status.', 'لا يمكنك تغيير دورك أو حالتك.')}</p>}
        <div className="rounded-xl border border-stone-line p-4">
          <Switch
            checked={watch('active') ?? false}
            onChange={(v) => setValue('active', v)}
            disabled={isSelf}
            label={t('Active account', 'حساب فعّال')}
            description={t('Inactive users cannot sign in.', 'لا يستطيع المستخدمون غير الفعّالين تسجيل الدخول.')}
          />
        </div>
      </form>
    </Dialog>
  )
}

export function UsersPage() {
  const { t, pick, formatDate, formatRelative, formatNumber } = useI18n()
  const { users, updateUser } = useData()
  const { user: me } = useAuth()
  const toast = useToast()
  const [q, setQ] = useState('')
  const [role, setRole] = useState<Role | ''>('')
  const [status, setStatus] = useState<'' | 'active' | 'inactive'>('')
  const [editing, setEditing] = useState<User | null>(null)
  const [toggling, setToggling] = useState<User | null>(null)

  const rows = useMemo(() => {
    const needle = normalizeSearch(q)
    return users.filter(
      (u) =>
        (!role || u.role === role) &&
        (!status || (status === 'active' ? u.active : !u.active)) &&
        (!needle || normalizeSearch(`${u.name} ${u.email} ${u.organization ?? ''}`).includes(needle)),
    )
  }, [users, q, role, status])

  const columns: Column<User>[] = [
    {
      key: 'name',
      header: t('User', 'المستخدم'),
      sortValue: (u) => u.name,
      cell: (u) => (
        <div className="flex items-center gap-3">
          <Avatar name={u.name} />
          <div className="min-w-0">
            <p className="font-medium text-ink">
              {u.name} {u.id === me?.id && <span className="text-xs text-accent-dark">({t('you', 'أنت')})</span>}
            </p>
            <p className="truncate text-xs text-muted" dir="ltr">
              {u.email}
            </p>
            {u.organization && <p className="truncate text-xs text-sage">{u.organization}</p>}
          </div>
        </div>
      ),
    },
    { key: 'role', header: t('Role', 'الدور'), sortValue: (u) => u.role, cell: (u) => <Badge tone={roleTone[u.role]}>{pick(roleLabels[u.role])}</Badge> },
    {
      key: 'status',
      header: t('Status', 'الحالة'),
      sortValue: (u) => (u.active ? 1 : 0),
      cell: (u) => (
        <span className="inline-flex items-center gap-1.5 text-sm">
          <span className={u.active ? 'size-2 rounded-full bg-olive-400' : 'size-2 rounded-full bg-limestone-dark'} />
          {u.active ? t('Active', 'فعّال') : t('Inactive', 'غير فعّال')}
        </span>
      ),
    },
    { key: 'created', header: t('Created', 'تاريخ الإنشاء'), sortValue: (u) => u.createdAt, cell: (u) => <span className="whitespace-nowrap text-muted">{formatDate(u.createdAt)}</span> },
    { key: 'last', header: t('Last active', 'آخر نشاط'), sortValue: (u) => u.lastActiveAt, cell: (u) => <span className="whitespace-nowrap text-muted">{formatRelative(u.lastActiveAt)}</span> },
    {
      key: 'actions',
      header: <span className="sr-only">{t('Actions', 'الإجراءات')}</span>,
      className: 'w-0',
      cell: (u) => (
        <div className="flex justify-end gap-0.5">
          <IconAction label={t(`Edit ${u.name}`, `تعديل ${u.name}`)} onClick={() => setEditing(u)}>
            <Pencil className="size-4" />
          </IconAction>
          {u.id !== me?.id && (
            <IconAction label={u.active ? t('Deactivate', 'إيقاف') : t('Activate', 'تفعيل')} onClick={() => setToggling(u)} tone={u.active ? 'danger' : 'default'}>
              {u.active ? <UserX className="size-4" /> : <UserCheck className="size-4" />}
            </IconAction>
          )}
        </div>
      ),
    },
  ]

  const header = <PageHeader title={t('User management', 'إدارة المستخدمين')} description={t('Team members, their roles and account status. Role and status changes are saved on the server.', 'أعضاء الفريق وأدوارهم وحالة حساباتهم. تُحفظ تغييرات الدور والحالة على الخادم.')} />

  if (!can.manageUsers(me?.role)) {
    return (
      <div>
        {header}
        <RestrictedState />
      </div>
    )
  }

  return (
    <div>
      {header}

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label={t('Total users', 'إجمالي المستخدمين')} value={formatNumber(users.length)} icon={<UsersIcon className="size-5" />} tone="forest" />
        <StatCard label={t('Active', 'فعّالون')} value={formatNumber(users.filter((u) => u.active).length)} icon={<UserCheck className="size-5" />} />
        <StatCard label={t('Reviewers', 'المراجعون')} value={formatNumber(users.filter((u) => u.role === 'reviewer').length)} icon={<ShieldCheck className="size-5" />} tone="gold" />
        <StatCard label={t('Contributors', 'المساهمون')} value={formatNumber(users.filter((u) => u.role === 'contributor').length)} icon={<UsersIcon className="size-5" />} tone="accent" />
      </div>

      <div className="card overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-stone-line p-4 md:flex-row md:items-center">
          <SearchBar value={q} onChange={setQ} placeholder={t('Search name, email or organization…', 'ابحث بالاسم أو البريد أو الجهة…')} className="md:w-80" />
          <Select value={role} onChange={(e) => setRole(e.target.value as Role | '')} aria-label={t('Role', 'الدور')} className="h-10 md:w-48">
            <option value="">{t('All roles', 'جميع الأدوار')}</option>
            {roles.map((r) => (
              <option key={r} value={r}>
                {pick(roleLabels[r])}
              </option>
            ))}
          </Select>
          <Select value={status} onChange={(e) => setStatus(e.target.value as '' | 'active' | 'inactive')} aria-label={t('Status', 'الحالة')} className="h-10 md:w-44">
            <option value="">{t('Any status', 'أي حالة')}</option>
            <option value="active">{t('Active', 'فعّال')}</option>
            <option value="inactive">{t('Inactive', 'غير فعّال')}</option>
          </Select>
        </div>
        <DataTable caption={t('Users', 'المستخدمون')} rows={rows} columns={columns} rowKey={(u) => u.id} initialSort={{ key: 'name', dir: 'asc' }} resetPageKey={`${q}|${role}|${status}`} />
      </div>

      <EditUserDialog user={editing} onClose={() => setEditing(null)} isSelf={editing?.id === me?.id} />
      <ConfirmDialog
        open={!!toggling}
        onClose={() => setToggling(null)}
        tone={toggling?.active ? 'danger' : 'primary'}
        title={toggling?.active ? t('Deactivate this account?', 'إيقاف هذا الحساب؟') : t('Activate this account?', 'تفعيل هذا الحساب؟')}
        description={toggling ? `${toggling.name} — ${toggling.email}` : undefined}
        confirmLabel={toggling?.active ? t('Deactivate', 'إيقاف') : t('Activate', 'تفعيل')}
        onConfirm={async () => {
          if (!toggling) return
          try {
            await updateUser(toggling.id, { active: !toggling.active })
            toast.success(toggling.active ? t('Account deactivated', 'تم إيقاف الحساب') : t('Account activated', 'تم تفعيل الحساب'))
          } catch (error) {
            toast.error(t('The account was not changed', 'لم يتغيّر الحساب'), errorMessage(error))
          }
        }}
      />
    </div>
  )
}
