import { useState } from 'react'
import { Link } from 'react-router'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ArrowLeft, KeyRound, Mail, MailCheck } from 'lucide-react'
import { mailtoContact } from '@/config/contact'
import { Field, Input } from '@/components/forms/Fields'
import { Button } from '@/components/ui/Button'
import { useAuth } from '@/hooks/useAuth'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { useI18n } from '@/hooks/useI18n'

/** Firebase sends a link to choose a new password; the administrators remain a fallback. */
export function ForgotPasswordPage() {
  const { t } = useI18n()
  const { resetPassword } = useAuth()
  const [sentTo, setSentTo] = useState<string | null>(null)
  useDocumentTitle(t('Forgot password', 'نسيت كلمة المرور'))

  const schema = z.object({
    email: z.string().trim().min(1, t('Email is required', 'البريد الإلكتروني مطلوب')).email(t('Enter a valid email address', 'أدخل بريدًا إلكترونيًا صحيحًا')),
  })
  type Values = z.infer<typeof schema>
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<Values>({ resolver: zodResolver(schema), defaultValues: { email: '' } })

  const onSubmit = async (v: Values) => {
    const res = await resetPassword(v.email)
    if (!res.ok) {
      setError('email', {
        message: res.error === 'network' ? t('No connection. Try again.', 'لا يوجد اتصال، حاول مجددًا.') : t('The email could not be sent', 'تعذّر إرسال البريد'),
      })
      return
    }
    setSentTo(v.email.trim())
  }

  return (
    <div>
      <span className="flex size-14 items-center justify-center rounded-full bg-olive-50 text-olive ring-8 ring-olive-50/50">
        {sentTo ? <MailCheck className="size-7" aria-hidden /> : <KeyRound className="size-7" aria-hidden />}
      </span>
      <h1 className="mt-6 text-3xl font-bold text-forest">{sentTo ? t('Check your email', 'تفقّد بريدك') : t('Forgot your password?', 'نسيت كلمة المرور؟')}</h1>

      {sentTo ? (
        <p className="mt-2 text-sm leading-relaxed text-muted" role="status">
          {t(
            `If an account exists for ${sentTo}, a link to choose a new password is on its way. Check the spam folder too.`,
            `إذا كان هناك حساب للبريد ${sentTo} فسيصلك رابط لاختيار كلمة مرور جديدة. تفقّد مجلد الرسائل غير المرغوبة أيضًا.`,
          )}
        </p>
      ) : (
        <>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            {t('Enter the email you registered with and we will send you a link to choose a new password.', 'أدخل البريد الذي سجّلت به وسنرسل لك رابطًا لاختيار كلمة مرور جديدة.')}
          </p>
          <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-7 space-y-5">
            <Field label={t('Email', 'البريد الإلكتروني')} required error={errors.email?.message}>
              {(id, d) => <Input id={id} type="email" dir="ltr" autoComplete="email" aria-describedby={d} invalid={!!errors.email} {...register('email')} />}
            </Field>
            <Button type="submit" size="lg" className="w-full" loading={isSubmitting}>
              <Mail className="size-4" aria-hidden />
              {t('Send the link', 'أرسل الرابط')}
            </Button>
          </form>
        </>
      )}

      <p className="mt-6 text-center text-sm text-muted">
        {t('No email arrived?', 'لم يصلك البريد؟')}{' '}
        <a href={mailtoContact('Qaryati password reset')} className="font-medium text-olive hover:text-accent-dark">
          {t('Write to the administrators', 'راسل الإدارة')}
        </a>
      </p>
      <Link to="/login" className="mt-8 inline-flex items-center gap-1.5 text-sm font-medium text-olive hover:text-accent-dark">
        <ArrowLeft className="size-4 rtl:rotate-180" aria-hidden />
        {t('Back to log in', 'العودة لتسجيل الدخول')}
      </Link>
    </div>
  )
}
