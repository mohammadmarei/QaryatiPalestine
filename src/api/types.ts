/*
 * Shapes the Qaryati API returns (docs/api/*.md, docs/api/openapi.yaml). Only the fields the frontend
 * reads are listed. src/api/mappers.ts turns them into the UI types of src/types.
 */

export interface Page<T> {
  data: T[]
  meta: { page: number; limit: number; totalItems: number; totalPages: number }
}

export interface ApiVerificationSummary {
  status: 'pending' | 'verified' | 'rejected'
  verifiedAt: string | null
}

export type ApiRole = 'admin' | 'editor' | 'reviewer' | 'contributor'

export interface ApiUser {
  id: number
  email: string
  fullName: string
  enabled: boolean
  roles: ApiRole[]
  createdAt: string
}

export interface ApiLoginResponse {
  accessToken: string
  tokenType: 'Bearer'
  expiresIn: number
  user: ApiUser
}

export interface ApiGovernorate {
  id: number
  name: string
  name_eng: string | null
  description: string | null
}

export interface ApiVillageName {
  id: number
  village_id: number
  ar_name: string
  eng_name: string | null
  name_type: string | null
  is_preferred: boolean
  meaning: string | null
  source_id: number | null
}

/** A village row as `GET /villages` and `GET /villages/:id` return it (snake_case columns). */
export interface ApiVillage {
  id: number
  current_name: string
  english_name: string | null
  name_origin_ar: string | null
  name_origin_eng: string | null
  arabic_description: string | null
  eng_description: string | null
  historical_overview_ar: string | null
  historical_overview_eng: string | null
  latitude: string | number | null
  longitude: string | number | null
  governorate_id: number | null
  administrative_area: string | null
  elevation_meters: string | number | null
  land_area_dunums: string | number | null
  record_status: string | null
  image: string | null
  alt_image: string | null
  feature_to_homepage: string | null
  created_at: string
  updated_at: string
  governorate?: ApiGovernorate | null
  names?: ApiVillageName[]
}

export interface ApiPopulationRecord {
  id: number
  villageId: number
  referenceYear: number
  population: number
  typeOfFigure: string | null
  sourceId: number | null
  notes: string | null
  conflicting: boolean
  verification: ApiVerificationSummary | null
}

export interface ApiHistoricalEvent {
  id: number
  villageId: number
  titleAr: string
  titleEng: string | null
  descriptionAr: string | null
  descriptionEng: string | null
  eventDate: string | null
  sourceId: number | null
  conflicting: boolean
  verification: ApiVerificationSummary | null
}

export interface ApiLandmark {
  id: number
  villageId: number
  nameAr: string
  nameEng: string | null
  type: string | null
  descriptionAr: string | null
  descriptionEng: string | null
  imageUrl: string | null
  sourceId: number | null
  verification: ApiVerificationSummary | null
}

export interface ApiFacility {
  id: number
  villageId: number
  nameAr: string
  nameEng: string | null
  type: string | null
  count: number | null
  sourceId: number | null
  conflicting: boolean
  verification: ApiVerificationSummary | null
}

export interface ApiEconomicActivity {
  id: number
  villageId: number
  nameAr: string
  nameEng: string | null
  sourceId: number | null
  verification: ApiVerificationSummary | null
}

export interface ApiVillageProduct {
  villageId: number
  productId: number
  nameAr: string
  nameEng: string | null
  descriptionAr: string | null
  descriptionEng: string | null
  sourceId: number | null
}

export interface ApiAgriculturalProduct {
  id: number
  nameAr: string
  nameEng: string | null
  descriptionAr: string | null
  descriptionEng: string | null
}

export interface ApiRelation {
  id: number
  villageId: number
  relatedVillageId: number
  nearbyVillage: { id: number; currentName: string; englishName: string | null }
  distanceKm: number | null
  description: string | null
  sourceId: number | null
  conflicting: boolean
}

export interface ApiCulturalPractice {
  id: number
  villageId: number
  category: string
  nameAr: string
  nameEng: string | null
  descriptionAr: string | null
  descriptionEng: string | null
  sourceId: number | null
  verification: ApiVerificationSummary | null
}

/** `GET /villages/:id/profile`: the whole village page in one answer (ADR-0011). */
export interface ApiVillageProfile {
  village: ApiVillage
  verification: ApiVerificationSummary | null
  population: Page<ApiPopulationRecord>
  historicalEvents: Page<ApiHistoricalEvent>
  landmarks: Page<ApiLandmark>
  culturalPractices: Page<ApiCulturalPractice>
  relations: Page<ApiRelation>
  facilities: Page<ApiFacility>
  economicActivities: Page<ApiEconomicActivity>
  agriculturalProducts: Page<ApiVillageProduct>
  missing: string[]
  generatedAt: string
}

export interface ApiSource {
  id: number
  title: string
  type: string
  author: string | null
  organization: string | null
  url: string | null
  reference: string | null
  publicationDate: string | null
  notes: { ar: string | null; en: string | null } | null
  createdAt: string
  verification: ApiVerificationSummary | null
}

export interface ApiVerification {
  id: number
  entityType: string
  entityId: number
  status: 'pending' | 'verified' | 'rejected'
  notes: string | null
  verifiedBy: number | null
  verifiedAt: string | null
}

export interface ApiAuditLog {
  id: number
  entityType: string
  entityId: number
  action: string
  userId: number | null
  changedFields: string[] | null
  oldValue: Record<string, unknown> | null
  newValue: Record<string, unknown> | null
  createdAt: string
}
