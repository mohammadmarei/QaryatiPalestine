import type { Bilingual, NearbyPlace, Village } from '@/types'
import { slugify } from '@/utils/misc'

/**
 * Ready-made list of villages and cities offered in the "Nearby villages &
 * cities" picker of the village form, so editors only choose a place and
 * type the distance.
 *
 * Villages that already have a profile in Qaryati are added at runtime from
 * the data store (and linked by id); this file only holds places that have
 * no profile of their own.
 */

export type PlaceKind = 'city' | 'village'

export interface PlaceOption {
  /** Stable key used by the form: `village:<id>` or `place:<slug>`. */
  id: string
  name: Bilingual
  kind: PlaceKind
  /** Set when the place has its own Qaryati profile. */
  villageId?: string
}

const p = (kind: PlaceKind, en: string, ar: string): PlaceOption => ({ id: `place:${slugify(en)}`, kind, name: { en, ar } })

export const cities: PlaceOption[] = [
  p('city', 'Jerusalem', 'القدس'),
  p('city', 'Bethlehem', 'بيت لحم'),
  p('city', 'Beit Jala', 'بيت جالا'),
  p('city', 'Beit Sahour', 'بيت ساحور'),
  p('city', 'Hebron', 'الخليل'),
  p('city', 'Halhul', 'حلحول'),
  p('city', 'Dura', 'دورا'),
  p('city', 'Yatta', 'يطا'),
  p('city', 'Ramallah', 'رام الله'),
  p('city', 'Al-Bireh', 'البيرة'),
  p('city', 'Birzeit', 'بيرزيت'),
  p('city', 'Nablus', 'نابلس'),
  p('city', 'Jenin', 'جنين'),
  p('city', 'Tulkarm', 'طولكرم'),
  p('city', 'Qalqilya', 'قلقيلية'),
  p('city', 'Salfit', 'سلفيت'),
  p('city', 'Tubas', 'طوباس'),
  p('city', 'Jericho', 'أريحا'),
  p('city', 'Gaza', 'غزة'),
  p('city', 'Jabalia', 'جباليا'),
  p('city', 'Beit Lahia', 'بيت لاهيا'),
  p('city', 'Beit Hanoun', 'بيت حانون'),
  p('city', 'Deir al-Balah', 'دير البلح'),
  p('city', 'Khan Yunis', 'خان يونس'),
  p('city', 'Rafah', 'رفح'),
]

/** Villages without a Qaryati profile yet. */
export const otherVillages: PlaceOption[] = [
  p('village', 'Husan', 'حوسان'),
  p('village', 'Al-Walaja', 'الولجة'),
  p('village', 'Al-Khader', 'الخضر'),
  p('village', 'Burqa', 'برقة'),
  p('village', 'Beit Imrin', 'بيت امرين'),
  p('village', 'Beita', 'بيتا'),
  p('village', 'Deir Yassin', 'دير ياسين'),
  p('village', 'Beit Iksa', 'بيت إكسا'),
  p('village', 'Bir Nabala', 'بير نبالا'),
  p('village', 'Rammun', 'رمون'),
  p('village', 'Deir Jarir', 'دير جرير'),
  p('village', 'Turmus Ayya', 'ترمسعيا'),
  p('village', 'Deir Abu Mash’al', 'دير أبو مشعل'),
  p('village', 'Kafr Dan', 'كفر دان'),
  p('village', 'Ya’bad', 'يعبد'),
  p('village', 'Abasan al-Kabira', 'عبسان الكبيرة'),
]

/** The form key for a stored nearby place. */
export const placeIdOf = (n: Pick<NearbyPlace, 'name' | 'villageId'>) => (n.villageId ? `village:${n.villageId}` : `place:${slugify(n.name.en)}`)

/**
 * Full picker list: profiled villages (linked by id) first, then the static
 * villages and cities. A static entry with the same English name as a
 * profiled village is dropped so each place appears once.
 */
export function buildPlaceOptions(villages: Village[]): PlaceOption[] {
  const profiled: PlaceOption[] = villages.map((v) => ({ id: `village:${v.id}`, kind: 'village', name: v.name, villageId: v.id }))
  const taken = new Set(profiled.map((o) => slugify(o.name.en)))
  return [...profiled, ...[...otherVillages, ...cities].filter((o) => !taken.has(slugify(o.name.en)))]
}
