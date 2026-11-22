import type { PopulationRecord, Village } from '@/types'
import { governorateById } from '@/data/governorates'
import { normalizeSearch } from '@/utils/misc'

export const governorateName = (id: string) => governorateById(id)?.name ?? { ar: id, en: id }

/** Matches names and spellings, plus the governorate and landmark names offered as hints in the search boxes. */
export const matchesVillage = (v: Village, q: string) => {
  if (!q) return true
  const needle = normalizeSearch(q)
  if (!needle) return true
  const gov = governorateName(v.governorateId)
  return [
    v.name.ar,
    v.name.en,
    ...v.altSpellings,
    ...v.historicalNames.flatMap((h) => [h.name.ar, h.name.en]),
    gov.ar,
    gov.en,
    ...v.heritage.flatMap((h) => [h.name.ar, h.name.en]),
  ].some((s) => normalizeSearch(s).includes(needle))
}

export const latestPopulation = (records: PopulationRecord[], villageId: string) =>
  records
    .filter((r) => r.villageId === villageId && r.kind !== 'estimate')
    .sort((a, b) => b.year - a.year)[0]

/** Only published records are visible on the public site. */
export const isPublic = (v: Village) => v.status === 'published'
