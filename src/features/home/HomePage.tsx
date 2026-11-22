import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { useI18n } from '@/hooks/useI18n'
import { AboutSection, FeaturedSection, GovernoratesSection, HeroSection, NewsletterSection, StatsStrip } from './HomeSections'

export function HomePage() {
  const { t } = useI18n()
  useDocumentTitle(t('Palestinian villages knowledge platform', 'منصة معرفة القرى الفلسطينية'))
  return (
    <>
      <HeroSection />
      <StatsStrip />
      <GovernoratesSection />
      <FeaturedSection />
      <AboutSection />
      <NewsletterSection />
    </>
  )
}
