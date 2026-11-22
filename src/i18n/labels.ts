import type {
  AuditAction,
  AuditLog,
  Bilingual,
  CulturalCategory,
  FacilityKind,
  HeritageKind,
  HeritageSection,
  PopulationKind,
  RecordStatus,
  ReviewStatus,
  Role,
  SourceType,
  SubmissionKind,
  VerificationStatus,
} from '@/types'

const b = (en: string, ar: string): Bilingual => ({ en, ar })

export const verificationLabels: Record<VerificationStatus, Bilingual> = {
  verified: b('Verified', 'موثّقة'),
  pending: b('Pending verification', 'قيد التحقق'),
  unverified: b('Unverified', 'غير موثّقة'),
  'needs-review': b('Needs review', 'بحاجة إلى مراجعة'),
}

export const recordStatusLabels: Record<RecordStatus, Bilingual> = {
  published: b('Published', 'منشور'),
  draft: b('Draft', 'مسودة'),
  pending: b('In review', 'قيد المراجعة'),
  archived: b('Archived', 'مؤرشف'),
}

export const reviewStatusLabels: Record<ReviewStatus, Bilingual> = {
  pending: b('Pending', 'بانتظار المراجعة'),
  approved: b('Approved', 'مقبولة'),
  rejected: b('Rejected', 'مرفوضة'),
  'changes-requested': b('Changes requested', 'مطلوب تعديلات'),
}

export const submissionKindLabels: Record<SubmissionKind, Bilingual> = {
  'new-village': b('New village', 'قرية جديدة'),
  edit: b('Profile edit', 'تعديل الملف'),
  population: b('Population data', 'بيانات السكان'),
  heritage: b('Heritage content', 'محتوى تراثي'),
  source: b('Source', 'مصدر'),
}

export const roleLabels: Record<Role, Bilingual> = {
  admin: b('Administrator', 'مدير النظام'),
  editor: b('Editor', 'محرر'),
  reviewer: b('Reviewer', 'مراجع'),
  contributor: b('Contributor', 'مساهم'),
}

export const sourceTypeLabels: Record<SourceType, Bilingual> = {
  book: b('Book', 'كتاب'),
  article: b('Article', 'مقالة'),
  archive: b('Archive', 'أرشيف'),
  census: b('Census', 'تعداد'),
  website: b('Website', 'موقع إلكتروني'),
  'oral-history': b('Oral history', 'تاريخ شفوي'),
  map: b('Map / Survey', 'خريطة / مسح'),
}

export const populationKindLabels: Record<PopulationKind, Bilingual> = {
  census: b('Census', 'تعداد'),
  estimate: b('Estimate', 'تقدير'),
  survey: b('Survey', 'مسح'),
}

export const heritageKindLabels: Record<HeritageKind, Bilingual> = {
  religious: b('Religious site', 'موقع ديني'),
  archaeological: b('Archaeological', 'موقع أثري'),
  architecture: b('Historic building', 'مبنى تاريخي'),
  natural: b('Natural heritage', 'تراث طبيعي'),
  cultural: b('Cultural heritage', 'تراث ثقافي'),
}

export const facilityKindLabels: Record<FacilityKind, Bilingual> = {
  school: b('Education', 'تعليم'),
  clinic: b('Health', 'صحة'),
  library: b('Library', 'مكتبة'),
  community: b('Community centre', 'مركز مجتمعي'),
  mosque: b('Mosque', 'مسجد'),
  church: b('Church', 'كنيسة'),
  council: b('Local council', 'مجلس محلي'),
  other: b('Other', 'أخرى'),
}

export const culturalCategoryLabels: Record<CulturalCategory, Bilingual> = {
  craft: b('Traditional craft', 'حرفة تقليدية'),
  food: b('Traditional food', 'طعام تقليدي'),
  'agricultural-practice': b('Agricultural practice', 'ممارسة زراعية'),
  custom: b('Custom or tradition', 'عادة أو تقليد'),
  'music-dance': b('Music and dance', 'موسيقى ورقص'),
  dress: b('Traditional dress', 'لباس تقليدي'),
  other: b('Other', 'أخرى'),
}

export const heritageSectionLabels: Record<HeritageSection, Bilingual> = {
  background: b('Historical background', 'الخلفية التاريخية'),
  names: b('Historical names', 'الأسماء التاريخية'),
  landmarks: b('Landmarks', 'المعالم'),
  culture: b('Cultural heritage', 'التراث الثقافي'),
  agriculture: b('Agriculture & economy', 'الزراعة والاقتصاد'),
  facilities: b('Public facilities', 'المرافق العامة'),
}

export const auditEntityLabels: Record<AuditLog['entityType'], Bilingual> = {
  village: b('Village', 'قرية'),
  population: b('Population record', 'سجل سكاني'),
  source: b('Source', 'مصدر'),
  heritage: b('Heritage entry', 'مدخل تراثي'),
  user: b('User', 'مستخدم'),
  review: b('Review', 'مراجعة'),
  session: b('Session', 'جلسة'),
}

export const auditActionLabels: Record<AuditAction, Bilingual> = {
  create: b('Created', 'إنشاء'),
  update: b('Updated', 'تحديث'),
  delete: b('Deleted', 'حذف'),
  approve: b('Approved', 'قبول'),
  reject: b('Rejected', 'رفض'),
  login: b('Signed in', 'تسجيل دخول'),
  publish: b('Published', 'نشر'),
  'role-change': b('Role change', 'تغيير صلاحية'),
}
