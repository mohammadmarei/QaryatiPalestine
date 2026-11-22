import { useState } from 'react'
import { Link } from 'react-router'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { CheckCircle2, UserPlus } from 'lucide-react'
import { Checkbox, Field, Input, PasswordInput } from '@/components/forms/Fields'
import { Button, ButtonLink } from '@/components/ui/Button'
import { useAuth } from '@/hooks/useAuth'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { useI18n } from '@/hooks/useI18n'
import { PasswordStrength, passwordScore } from './PasswordStrength'

export function RegisterPage() {
  const { t } = useI18n()
  const { register: registerAccount } = useAuth()
  const [done, setDone] = useState<string | null>(null)
  useDocumentTitle(t('Create account', 'إنشاء حساب'))

  const schema = z
    .object({
      name: z.string().trim().min(3, t('Enter your full name', 'أدخل اسمك الكامل')),
      email: z.string().trim().min(1, t('Email is required', 'البريد الإلكتروني مطلوب')).email(t('Enter a valid email address', 'أدخل بريدًا إلكترونيًا صحيحًا')),
      password: z.string().min(8, t('Use at least 8 characters', 'استخدم 8 أحرف على الأقل')).refine((p) => passwordScore(p) >= 3, t('Choose a stronger password', 'اختر كلمة مرور أقوى')),
      confirm: z.string().min(1, t('Please confirm your password', 'يرجى تأكيد كلمة المرور')),
      terms: z.boolean().refine((v) => v, t('Please accept the contribution guidelines', 'يرجى الموافقة على إرشادات المساهمة')),
    })
    .refine((v) => v.password === v.confirm, { path: ['confirm'], message: t('Passwords do not match', 'كلمتا المرور غير متطابقتين') })
  type Values = z.infer<typeof schema>

  const {
    register,
    handleSubmit,
    watch,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<Values>({ resolver: zodResolver(schema), defaultValues: { name: '', email: '', password: '', confirm: '', terms: false } })

  const onSubmit = async (v: Values) => {
    const res = await registerAccount(v.name, v.email, v.password)
    if (!res.ok) {
      setError('email', { message: t('An account with this email already exists', 'يوجد حساب مسجّل بهذا البريد الإلكتروني') })
      return
    }
    setDone(v.email)
  }

  if (done) {
    return (
      <div className="animate-scale-in text-center" role="status">
        <span className="mx-auto flex size-16 items-center justify-center rounded-full bg-olive-50 text-olive ring-8 ring-olive-50/50">
          <CheckCircle2 className="size-8" />
        </span>
        <h1 className="mt-6 text-2xl font-semibold text-forest">{t('Your account is ready', 'حسابك جاهز')}</h1>
        <p className="mt-2 text-muted">
          {t(
            `A contributor account for ${done} was created in this browser. You can now log in with it.`,
            `تم إنشاء حساب مساهم للبريد ${done} في هذا المتصفح. يمكنك الآن تسجيل الدخول به.`,
          )}
        </p>
        <ButtonLink to="/login" size="lg" className="mt-8 w-full">
          {t('Continue to log in', 'المتابعة لتسجيل الدخول')}
        </ButtonLink>
      </div>
    )
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-forest">{t('Join the Qaryati community', 'انضم إلى مجتمع قريتي')}</h1>
      <p className="mt-2 text-sm text-muted">
        {t('Help document your village. New accounts start as contributors; editors review every submission.', 'ساعد في توثيق قريتك. تبدأ الحسابات الجديدة بصفة مساهم، ويراجع المحررون كل مساهمة.')}
      </p>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-7 space-y-5">
        <Field label={t('Full name', 'الاسم الكامل')} required error={errors.name?.message}>
          {(id, d) => <Input id={id} autoComplete="name" aria-describedby={d} invalid={!!errors.name} {...register('name')} />}
        </Field>
        <Field label={t('Email', 'البريد الإلكتروني')} required error={errors.email?.message}>
          {(id, d) => <Input id={id} type="email" dir="ltr" autoComplete="email" aria-describedby={d} invalid={!!errors.email} {...register('email')} />}
        </Field>
        <Field label={t('Password', 'كلمة المرور')} required error={errors.password?.message}>
          {(id, d) => <PasswordInput id={id} autoComplete="new-password" aria-describedby={d} invalid={!!errors.password} {...register('password')} />}
        </Field>
        <PasswordStrength password={watch('password') ?? ''} />
        <Field label={t('Confirm password', 'تأكيد كلمة المرور')} required error={errors.confirm?.message}>
          {(id, d) => <PasswordInput id={id} autoComplete="new-password" aria-describedby={d} invalid={!!errors.confirm} {...register('confirm')} />}
        </Field>
        <div>
          <Checkbox label={t('I agree to cite sources and follow the contribution guidelines', 'أوافق على ذكر المصادر واتباع إرشادات المساهمة')} {...register('terms')} />
          {errors.terms && (
            <p role="alert" className="mt-1 text-xs font-medium text-accent-dark">
              {errors.terms.message}
            </p>
          )}
        </div>
        <Button type="submit" size="lg" className="w-full" loading={isSubmitting} icon={<UserPlus className="size-4" />}>
          {isSubmitting ? t('Creating account…', 'جارٍ إنشاء الحساب…') : t('Create account', 'إنشاء الحساب')}
        </Button>
      </form>

      <p className="mt-8 text-center text-sm text-muted">
        {t('Already have an account?', 'لديك حساب بالفعل؟')}{' '}
        <Link to="/login" className="font-semibold text-olive hover:text-accent-dark">
          {t('Log in', 'تسجيل الدخول')}
        </Link>
      </p>
    </div>
  )
}
