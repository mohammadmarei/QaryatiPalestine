import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { AlertCircle, LogIn, Mail } from 'lucide-react'
import { Checkbox, Field, Input, PasswordInput } from '@/components/forms/Fields'
import { Button } from '@/components/ui/Button'
import { useAuth } from '@/hooks/useAuth'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { useI18n } from '@/hooks/useI18n'
import { useToast } from '@/hooks/useToast'
import { readSettings } from '../settings/settingsStore'

export function LoginPage() {
  const { t } = useI18n()
  const { login } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()
  const location = useLocation()
  const [authError, setAuthError] = useState<null | 'invalid' | 'disabled' | 'network' | 'rate-limited'>(null)
  useDocumentTitle(t('Log in', 'تسجيل الدخول'))

  const from = (location.state as { from?: string } | null)?.from ?? readSettings().startPage

  const schema = z.object({
    email: z.string().trim().min(1, t('Email is required', 'البريد الإلكتروني مطلوب')).email(t('Enter a valid email address', 'أدخل بريدًا إلكترونيًا صحيحًا')),
    password: z.string().min(1, t('Password is required', 'كلمة المرور مطلوبة')).min(6, t('Password must be at least 6 characters', 'يجب ألا تقل كلمة المرور عن 6 أحرف')),
    remember: z.boolean(),
  })
  type Values = z.infer<typeof schema>

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Values>({ resolver: zodResolver(schema), defaultValues: { email: '', password: '', remember: true } })

  const welcome = (name: string) => toast.success(t(`Welcome back, ${name.split(' ')[0]}`, `أهلًا بعودتك، ${name.split(' ')[0]}`), t('Signed in to the Qaryati workspace.', 'تم الدخول إلى مساحة عمل قريتي.'))

  const onSubmit = async (v: Values) => {
    setAuthError(null)
    const res = await login(v.email, v.password, v.remember)
    if (!res.ok) {
      setAuthError(res.error)
      return
    }
    welcome(res.user.name)
    navigate(from, { replace: true })
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-forest">{t('Welcome back', 'مرحباً بعودتك')}</h1>
      <p className="mt-2 text-sm text-muted">{t('Access the documentation workspace for editors, reviewers and contributors.', 'ادخل إلى مساحة التوثيق الخاصة بالمحررين والمراجعين والمساهمين.')}</p>

      {authError && (
        <div role="alert" className="mt-6 flex animate-scale-in items-start gap-3 rounded-2xl border border-danger/30 bg-danger-50 p-4 text-sm text-danger">
          <AlertCircle className="mt-0.5 size-4 shrink-0" />
          <div>
            <p className="font-semibold">
              {authError === 'network'
                ? t('No connection', 'لا يوجد اتصال')
                : authError === 'rate-limited'
                  ? t('Too many attempts', 'محاولات كثيرة')
                  : authError === 'disabled'
                    ? t('This account is disabled', 'هذا الحساب معطّل')
                    : t('Email or password is incorrect', 'البريد الإلكتروني أو كلمة المرور غير صحيحة')}
            </p>
            <p className="mt-0.5 text-danger/80">
              {authError === 'network'
                ? t('Check your internet connection, then try again.', 'تحقّق من اتصالك بالإنترنت ثم حاول مجددًا.')
                : authError === 'rate-limited'
                  ? t('Wait a minute, then try again.', 'انتظر دقيقة ثم حاول مجددًا.')
                  : t('Check your details and try again.', 'تحقق من بياناتك وحاول مجددًا.')}
            </p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-7 space-y-5">
        <Field label={t('Email', 'البريد الإلكتروني')} error={errors.email?.message}>
          {(id, d) => <Input id={id} type="email" dir="ltr" autoComplete="email" leading={<Mail className="size-4" />} aria-describedby={d} invalid={!!errors.email} {...register('email')} />}
        </Field>
        <Field
          label={t('Password', 'كلمة المرور')}
          error={errors.password?.message}
          labelAside={
            <Link to="/forgot-password" className="text-xs font-medium text-olive hover:text-accent-dark">
              {t('Forgot password?', 'نسيت كلمة المرور؟')}
            </Link>
          }
        >
          {(id, d) => <PasswordInput id={id} autoComplete="current-password" aria-describedby={d} invalid={!!errors.password} {...register('password')} />}
        </Field>
        <Checkbox label={t('Remember me on this device', 'تذكّرني على هذا الجهاز')} {...register('remember')} />
        <Button type="submit" size="lg" className="w-full" loading={isSubmitting} icon={<LogIn className="size-4 rtl:rotate-180" />}>
          {isSubmitting ? t('Signing in…', 'جارٍ تسجيل الدخول…') : t('Log in', 'تسجيل الدخول')}
        </Button>
      </form>

      <p className="mt-8 text-center text-sm text-muted">
        {t('New to Qaryati?', 'جديد في قريتي؟')}{' '}
        <Link to="/register" className="font-semibold text-olive hover:text-accent-dark">
          {t('Create a contributor account', 'أنشئ حساب مساهم')}
        </Link>
      </p>
    </div>
  )
}
