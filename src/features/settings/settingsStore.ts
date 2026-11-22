import type { Lang } from '@/types'
import { storage } from '@/utils/storage'

export const SETTINGS_KEY = 'qaryati.settings'

export interface Settings {
  language: Lang
  reduceMotion: boolean
  pageSize: number
  notifications: { submissions: boolean; decisions: boolean; mentions: boolean; digest: boolean }
  channel: 'in-app' | 'email'
  startPage: string
}

export const defaultSettings: Settings = {
  language: 'ar',
  reduceMotion: false,
  pageSize: 10,
  notifications: { submissions: true, decisions: true, mentions: true, digest: false },
  channel: 'in-app',
  startPage: '/dashboard',
}

export const readSettings = (): Settings => ({ ...defaultSettings, ...storage.getJSON<Partial<Settings>>(SETTINGS_KEY, {}) })

export function applyMotionPreference(reduce: boolean) {
  document.documentElement.classList.toggle('reduce-motion', reduce)
}
