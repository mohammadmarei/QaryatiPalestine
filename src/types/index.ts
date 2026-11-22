/**
 * Domain types for Qaryati.
 *
 * A village is one Firestore document in this nested shape (src/firebase/model.ts adds the fields only the
 * database needs). Items that state a fact keep the id of the source that documents it in `sourceId`.
 */

export type Lang = 'ar' | 'en'

/** Any human-readable content is stored in both languages. */
export interface Bilingual {
  ar: string
  en: string
}

export interface Coordinates {
  lat: number
  lng: number
}

export type Region = 'west-bank' | 'gaza'

export interface Governorate {
  id: string
  name: Bilingual
  region: Region
  center: Coordinates
}

/** Editorial lifecycle of a record inside the dashboard. */
export type RecordStatus = 'published' | 'draft' | 'pending' | 'archived'

/** Whether the content has been checked against sources. */
export type VerificationStatus = 'verified' | 'pending' | 'unverified' | 'needs-review'

export type SceneKind = 'terraces' | 'grove' | 'ruins' | 'hilltop' | 'valley' | 'plain'

export interface ArtDirection {
  scene: SceneKind
  /** Index into the illustration palettes (0–5). */
  palette: number
}

export interface HistoricalName {
  name: Bilingual
  /** The date the name first appeared, e.g. "1596" or "27 BCE". */
  period: string
  kind?: 'historical' | 'former'
  /** Origin or meaning of the name, as the source gives it. */
  meaning?: string
  sourceId?: string
}

export interface HistoricalEvent {
  id: string
  year: string
  title: Bilingual
  description: Bilingual
  /** The full day (YYYY-MM-DD) when the source gives one. */
  date?: string
  sourceId?: string
}

export type HeritageKind = 'religious' | 'archaeological' | 'architecture' | 'natural' | 'cultural'

export interface HeritageSite {
  id: string
  name: Bilingual
  kind: HeritageKind
  period?: Bilingual
  description: Bilingual
  /** Photo of the landmark (an image URL). */
  image?: string
  sourceId?: string
}

/** Kinds of cultural characteristic; the API and the database accept the same list. */
export type CulturalCategory = 'craft' | 'food' | 'agricultural-practice' | 'custom' | 'music-dance' | 'dress' | 'other'

export interface CulturalPractice {
  id: string
  category?: CulturalCategory
  title: Bilingual
  description: Bilingual
  sourceId?: string
}

export type FacilityKind = 'school' | 'clinic' | 'library' | 'community' | 'mosque' | 'church' | 'council' | 'other'

export interface Facility {
  id: string
  kind: FacilityKind
  name: Bilingual
  count?: number
  sourceId?: string
}

export interface NearbyPlace {
  name: Bilingual
  distanceKm: number
  villageId?: string
  sourceId?: string
}

/** A major crop and how it is farmed. */
export interface Crop extends Bilingual {
  practices?: Bilingual
  /** Entry of the crop catalogue (agriculturalProducts). */
  productId?: string
  sourceId?: string
}

/** An economic activity of the village. */
export interface EconomicActivity extends Bilingual {
  sourceId?: string
}

export interface Agriculture {
  crops: Crop[]
  /**
   * Older, village-wide practices text. Kept for records written before
   * practices were recorded per crop; the form moves it into the first crop.
   */
  practices?: Bilingual
  economy: EconomicActivity[]
}

export interface Village {
  id: string
  name: Bilingual
  /** Other Latin transliterations in circulation. */
  altSpellings: string[]
  historicalNames: HistoricalName[]
  governorateId: string
  /** e.g. "Bethlehem District · Area C" */
  adminArea: Bilingual
  summary: Bilingual
  description: Bilingual
  coordinates: Coordinates
  elevationM?: number
  areaDunums?: number
  nearby: NearbyPlace[]
  history: {
    overview: Bilingual
    nameOrigin: Bilingual
    events: HistoricalEvent[]
  }
  heritage: HeritageSite[]
  culture: CulturalPractice[]
  agriculture: Agriculture
  facilities: Facility[]
  sourceIds: string[]
  /** Main photo of the village; without one the page shows `art`. */
  coverImage?: string
  /** Description of the photo with its author and licence, shown as its caption. */
  coverCaption?: string
  art: ArtDirection
  featured?: boolean
  /** Depopulated or destroyed villages are documented too. */
  depopulated?: { year: number; note: Bilingual }
  status: RecordStatus
  verification: VerificationStatus
  createdAt: string
  updatedAt: string
  createdBy: string
}

export type PopulationKind = 'census' | 'estimate' | 'survey'

export interface PopulationRecord {
  id: string
  villageId: string
  year: number
  population: number
  kind: PopulationKind
  sourceId: string
  note?: string
}

export type SourceType = 'book' | 'article' | 'archive' | 'census' | 'website' | 'oral-history' | 'map'

export interface Source {
  id: string
  title: string
  type: SourceType
  author?: string
  /** Publishing or issuing body (institution, ministry, NGO…). */
  organization?: string
  reference: string
  url?: string
  publishedAt: string
  villageIds: string[]
  note?: Bilingual
  /** When the online copy was last read (YYYY-MM-DD). */
  accessedAt?: string
  verification?: VerificationStatus
}

export type Role = 'admin' | 'editor' | 'reviewer' | 'contributor'

export interface User {
  id: string
  name: string
  email: string
  role: Role
  active: boolean
  createdAt: string
  lastActiveAt: string
  organization?: string
}

export type ReviewStatus = 'pending' | 'approved' | 'rejected' | 'changes-requested'

export type SubmissionKind = 'new-village' | 'edit' | 'population' | 'heritage' | 'source'

export interface ReviewHistoryEntry {
  at: string
  by: string
  action: ReviewStatus | 'submitted'
  note?: string
}

export interface Submission {
  id: string
  villageId: string
  kind: SubmissionKind
  submittedBy: string
  submittedAt: string
  status: ReviewStatus
  summary: Bilingual
  changes: { field: string; before?: string; after: string }[]
  history: ReviewHistoryEntry[]
}

export type AuditAction = 'create' | 'update' | 'delete' | 'approve' | 'reject' | 'login' | 'publish' | 'role-change'

export interface AuditLog {
  id: string
  userId: string
  action: AuditAction
  entityType: 'village' | 'population' | 'source' | 'heritage' | 'user' | 'review' | 'session'
  entityLabel: string
  at: string
  details: string
  ip: string
}

export interface NotificationItem {
  id: string
  title: Bilingual
  body: Bilingual
  at: string
  read: boolean
  href: string
}

/** Content blocks managed under "History & Heritage". */
export type HeritageSection = 'background' | 'names' | 'landmarks' | 'culture' | 'agriculture' | 'facilities'

export interface HeritageEntry {
  id: string
  section: HeritageSection
  villageId: string
  title: Bilingual
  body: Bilingual
  category?: string
  /** Date or period the entry refers to (historical background and names). */
  period?: string
  updatedAt: string
}
