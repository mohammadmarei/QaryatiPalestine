import { Link } from 'react-router'
import { Mail, MapPin, Phone } from 'lucide-react'
import { contact } from '@/config/contact'
import { useI18n } from '@/hooks/useI18n'
import { cn, container } from '@/utils/cn'
import { Logo } from '../brand/Logo'

export function PublicFooter() {
  const { t, pick } = useI18n()
  const year = new Date().getFullYear()

  const columns = [
    {
      title: t('Explore', 'استكشف'),
      links: [
        { to: '/villages', label: t('Village directory', 'دليل القرى') },
        { to: '/map', label: t('Interactive map', 'الخريطة التفاعلية') },
        { to: '/villages?featured=1', label: t('Featured villages', 'قرى مختارة') },
      ],
    },
    {
      title: t('About the platform', 'عن المنصة'),
      links: [
        { to: '/about', label: t('Our vision', 'رؤيتنا') },
        { to: '/about#method', label: t('Documentation method', 'منهجية التوثيق') },
        { to: '/about#team', label: t('Project team', 'فريق المشروع') },
        { to: '/register', label: t('Contribute', 'ساهم معنا') },
      ],
    },
    {
      title: t('Account', 'الحساب'),
      links: [
        { to: '/login', label: t('Sign in', 'تسجيل الدخول') },
        { to: '/register', label: t('Create an account', 'إنشاء حساب') },
        { to: '/dashboard', label: t('Admin dashboard', 'لوحة الإدارة') },
      ],
    },
  ]

  return (
    <footer className="mt-auto bg-forest-900 pt-16 text-white">
      <div className={cn(container, 'grid gap-12 pb-14 md:grid-cols-[2fr_repeat(3,1fr)]')}>
        <div>
          <Logo inverted />
          <p className="mt-5 max-w-[17rem] text-[13px] leading-loose text-[#9fb4b0]">
            {t('An independent knowledge platform for preserving and organizing the memory of Palestinian villages.', 'منصة معرفية مستقلة لحفظ وتنظيم ذاكرة القرى الفلسطينية.')}
          </p>
          <ul className="mt-5 space-y-2 text-[13px] text-[#9fb4b0]">
            <li className="flex items-center gap-2">
              <Mail className="size-4 text-gold" aria-hidden />
              <a href={`mailto:${contact.email}`} className="break-all hover:text-white" dir="ltr">
                {contact.email}
              </a>
            </li>
            <li className="flex items-center gap-2">
              <Phone className="size-4 text-gold" aria-hidden />
              <a href={`tel:${contact.phoneIntl}`} className="hover:text-white" dir="ltr">
                {contact.phone}
              </a>
            </li>
            <li className="flex items-center gap-2">
              <MapPin className="size-4 text-gold" aria-hidden />
              {pick(contact.location)}
            </li>
          </ul>
        </div>
        {columns.map((c) => (
          <div key={c.title}>
            <h3 className="mb-4 text-sm font-bold">{c.title}</h3>
            <ul className="space-y-1">
              {c.links.map((l) => (
                <li key={l.label}>
                  <Link to={l.to} className="block py-1 text-[13px] text-[#9fb4b0] transition hover:text-white">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className={cn(container, 'flex flex-col justify-between gap-2 border-t border-[#274641] py-5 text-xs text-[#78918c] sm:flex-row')}>
        <span>
          © {year} {t('Qaryati. Knowledge belongs to everyone.', 'قريتي. المعرفة حق للجميع.')}
        </span>
        <span>{t('Every record cites its source and is reviewed before publishing.', 'كل سجل موثّق بمصدره ويُراجَع قبل النشر.')}</span>
      </div>
    </footer>
  )
}
