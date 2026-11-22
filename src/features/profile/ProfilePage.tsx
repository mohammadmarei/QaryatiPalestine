import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { CalendarDays, CircleDot, Clock, KeyRound, Mail, Save, ShieldCheck } from 'lucide-react'
import { roleLabels } from '@/i18n/labels'
import { PageHeader } from '@/components/layout/PageHeader'
import { Field, Input } from '@/components/forms/Fields'
import { Badge } from '@/components/ui/Badge'
import { Button, buttonClass } from '@/components/ui/Button'
import { Avatar } from '@/components/ui/Misc'
import { useAuth } from '@/hooks/useAuth'
import { useData } from '@/hooks/useData'
import { useI18n } from '@/hooks/useI18n'
import { useToast } from '@/hooks/useToast'
import { errorMessage } from '@/firebase/errors'
import { mailtoContact } from '@/config/contact'

export function ProfilePage() {
  const { t, pick, formatDate, formatRelative } = useI18n()
  const { user, updateUser: updateSession } = useAuth()
  const { updateUser, auditLogs, users } = useData()
  const toast = useToast()

  const infoSchema = z.object({
    name: z.string().trim().min(3, t('Name is required', 'الاسم مطلوب')),
    email: z.string().trim().email(t('Enter a valid email address', 'أدخل بريدًا إلكترونيًا صحيحًا')),
    organization: z.string().trim().max(80),
  })
  type Info = z.infer<typeof infoSchema>
  const info = useForm<Info>({ resolver: zodResolver(infoSchema), defaultValues: { name: user?.name ?? '', email: user?.email ?? '', organization: user?.organization ?? '' } })

  useEffect(() => {
    if (user) info.reset({ name: user.name, email: user.email, organization: user.organization ?? '' })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id])

  if (!user) return null

  const saveInfo = async (v: Info) => {
    try {
      // The sign-in email is the account's identity and is not changed here.
      await updateUser(user.id, { name: v.name, organization: v.organization || undefined })
    } catch (error) {
      toast.error(t('The profile was not saved', 'لم يُحفظ الملف الشخصي'), errorMessage(error))
      return
    }
    updateSession({ name: v.name, organization: v.organization || undefined })
    info.reset({ ...v, email: user.email })
    toast.success(t('Profile saved', 'تم حفظ الملف الشخصي'))
  }

  const myActivity = auditLogs.filter((l) => l.userId === user.id).length
  // The team record holds status/activity that the session copy may not reflect.
  const record = users.find((u) => u.id === user.id) ?? user

  return (
    <div>
      <PageHeader title={t('My profile', 'ملفي الشخصي')} description={t('Your personal details and password.', 'بياناتك الشخصية وكلمة المرور.')} crumbs={[{ label: t('Profile', 'الملف الشخصي') }]} />

      <div className="grid gap-6 xl:grid-cols-[20rem_1fr]">
        <aside className="card h-fit overflow-hidden">
          <div className="relative h-24 bg-forest">
            <div className="absolute inset-0 bg-dots-light" aria-hidden />
          </div>
          <div className="relative -mt-12 px-6 pb-6 text-center">
            <Avatar name={user.name} size="xl" className="mx-auto ring-4" />
            <h2 className="mt-3 text-lg font-semibold text-ink">{user.name}</h2>
            <p className="text-sm text-muted" dir="ltr">
              {user.email}
            </p>
            <Badge tone="forest" className="mt-3" icon={<ShieldCheck className="size-3.5" />}>
              {pick(roleLabels[user.role])}
            </Badge>
            <dl className="mt-6 space-y-3 border-t border-stone-line pt-5 text-start text-sm">
              <div className="flex items-center justify-between gap-2">
                <dt className="flex items-center gap-2 text-muted">
                  <CalendarDays className="size-4" /> {t('Member since', 'عضو منذ')}
                </dt>
                <dd className="font-medium">{formatDate(user.createdAt, { year: 'numeric', month: 'long' })}</dd>
              </div>
              <div className="flex items-center justify-between gap-2">
                <dt className="flex items-center gap-2 text-muted">
                  <CircleDot className="size-4" /> {t('Account status', 'حالة الحساب')}
                </dt>
                <dd className="flex items-center gap-1.5 font-medium">
                  <span className={record.active ? 'size-2 rounded-full bg-olive-400' : 'size-2 rounded-full bg-limestone-dark'} aria-hidden />
                  {record.active ? t('Active', 'فعّال') : t('Inactive', 'غير فعّال')}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-2">
                <dt className="flex items-center gap-2 text-muted">
                  <Clock className="size-4" /> {t('Last active', 'آخر نشاط')}
                </dt>
                <dd className="font-medium">{formatRelative(record.lastActiveAt)}</dd>
              </div>
              <div className="flex items-center justify-between gap-2">
                <dt className="flex items-center gap-2 text-muted">
                  <Mail className="size-4" /> {t('Organization', 'الجهة')}
                </dt>
                <dd className="font-medium">{user.organization ?? '—'}</dd>
              </div>
              <div className="flex items-center justify-between gap-2">
                <dt className="flex items-center gap-2 text-muted">
                  <KeyRound className="size-4" /> {t('Logged actions', 'إجراءات مسجلة')}
                </dt>
                <dd className="font-medium">{myActivity}</dd>
              </div>
            </dl>
          </div>
        </aside>

        <div className="space-y-6">
          <section className="card p-6 sm:p-8" aria-labelledby="info-h">
            <h2 id="info-h" className="text-lg font-semibold text-ink">
              {t('Personal information', 'المعلومات الشخصية')}
            </h2>
            <form onSubmit={info.handleSubmit(saveInfo)} noValidate className="mt-6 space-y-5">
              <div className="grid gap-5 md:grid-cols-2">
                <Field label={t('Full name', 'الاسم الكامل')} required error={info.formState.errors.name?.message}>
                  {(id, d) => <Input id={id} aria-describedby={d} invalid={!!info.formState.errors.name} {...info.register('name')} />}
                </Field>
                <Field label={t('Email', 'البريد الإلكتروني')} required error={info.formState.errors.email?.message}>
                  {(id, d) => <Input id={id} type="email" dir="ltr" readOnly aria-describedby={d} invalid={!!info.formState.errors.email} {...info.register('email')} />}
                </Field>
              </div>
              <Field label={t('Organization', 'الجهة')} error={info.formState.errors.organization?.message}>
                {(id) => <Input id={id} {...info.register('organization')} />}
              </Field>
              <Field label={t('Role', 'الدور')} hint={t('Roles are assigned by an administrator.', 'يحدد مدير النظام الأدوار.')}>
                {(id, d) => <Input id={id} aria-describedby={d} value={pick(roleLabels[user.role])} disabled readOnly />}
              </Field>
              <div className="flex justify-end">
                <Button type="submit" loading={info.formState.isSubmitting} disabled={!info.formState.isDirty} icon={<Save className="size-4" />}>
                  {t('Save changes', 'حفظ التغييرات')}
                </Button>
              </div>
            </form>
          </section>

          <section className="card p-6 sm:p-8" aria-labelledby="pw-h">
            <h2 id="pw-h" className="text-lg font-semibold text-ink">
              {t('Change password', 'تغيير كلمة المرور')}
            </h2>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted">
              {t(
                'Passwords are changed by the platform administrators. Email us from your account address and we will set a new one.',
                'تغيّر إدارة المنصة كلمات المرور. راسلنا من بريد حسابك وسنعيّن لك كلمة مرور جديدة.',
              )}
            </p>
            <a href={mailtoContact('Qaryati password change')} className={buttonClass('secondary', 'md', 'mt-5')}>
              <KeyRound className="size-4" aria-hidden />
              {t('Email the administrators', 'راسل الإدارة')}
            </a>
          </section>
        </div>
      </div>
    </div>
  )
}
