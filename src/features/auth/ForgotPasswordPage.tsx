import { Link } from 'react-router'
import { ArrowLeft, KeyRound, Mail, Phone } from 'lucide-react'
import { contact, mailtoContact } from '@/config/contact'
import { buttonClass } from '@/components/ui/Button'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { useI18n } from '@/hooks/useI18n'

/**
 * Passwords are reset by the platform administrators: the API has no self-service reset, so this page says
 * how to reach them instead of pretending to send an email.
 */
export function ForgotPasswordPage() {
  const { t } = useI18n()
  useDocumentTitle(t('Forgot password', 'نسيت كلمة المرور'))

  return (
    <div>
      <span className="flex size-14 items-center justify-center rounded-full bg-olive-50 text-olive ring-8 ring-olive-50/50">
        <KeyRound className="size-7" aria-hidden />
      </span>
      <h1 className="mt-6 text-3xl font-bold text-forest">{t('Forgot your password?', 'نسيت كلمة المرور؟')}</h1>
      <p className="mt-2 text-sm leading-relaxed text-muted">
        {t(
          'Passwords are reset by the platform administrators. Write to us from the email you registered with, and we will set a new password for your account.',
          'تتم إعادة تعيين كلمات المرور عن طريق إدارة المنصة. راسلنا من البريد الذي سجّلت به، وسنعيّن كلمة مرور جديدة لحسابك.',
        )}
      </p>
      <a href={mailtoContact('Qaryati password reset')} className={buttonClass('primary', 'lg', 'mt-7 w-full')}>
        <Mail className="size-4" aria-hidden />
        {t('Email the administrators', 'راسل الإدارة')}
      </a>
      <p className="mt-4 flex items-center justify-center gap-2 text-sm text-muted">
        <Phone className="size-4 text-gold" aria-hidden />
        <a href={`tel:${contact.phoneIntl}`} dir="ltr" className="hover:text-forest">
          {contact.phone}
        </a>
      </p>
      <Link to="/login" className="mt-8 inline-flex items-center gap-1.5 text-sm font-medium text-olive hover:text-accent-dark">
        <ArrowLeft className="size-4 rtl:rotate-180" aria-hidden />
        {t('Back to log in', 'العودة لتسجيل الدخول')}
      </Link>
    </div>
  )
}
