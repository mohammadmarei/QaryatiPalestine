import type { Governorate } from '@/types'

export const governorates: Governorate[] = [
  { id: 'jenin', name: { ar: 'جنين', en: 'Jenin' }, region: 'west-bank', center: { lat: 32.46, lng: 35.3 } },
  { id: 'tubas', name: { ar: 'طوباس', en: 'Tubas' }, region: 'west-bank', center: { lat: 32.32, lng: 35.37 } },
  { id: 'tulkarm', name: { ar: 'طولكرم', en: 'Tulkarm' }, region: 'west-bank', center: { lat: 32.31, lng: 35.03 } },
  { id: 'nablus', name: { ar: 'نابلس', en: 'Nablus' }, region: 'west-bank', center: { lat: 32.22, lng: 35.26 } },
  { id: 'qalqilya', name: { ar: 'قلقيلية', en: 'Qalqilya' }, region: 'west-bank', center: { lat: 32.19, lng: 34.97 } },
  { id: 'salfit', name: { ar: 'سلفيت', en: 'Salfit' }, region: 'west-bank', center: { lat: 32.08, lng: 35.18 } },
  { id: 'ramallah', name: { ar: 'رام الله والبيرة', en: 'Ramallah & Al-Bireh' }, region: 'west-bank', center: { lat: 31.9, lng: 35.2 } },
  { id: 'jericho', name: { ar: 'أريحا والأغوار', en: 'Jericho & Al-Aghwar' }, region: 'west-bank', center: { lat: 31.86, lng: 35.46 } },
  { id: 'jerusalem', name: { ar: 'القدس', en: 'Jerusalem' }, region: 'west-bank', center: { lat: 31.78, lng: 35.22 } },
  { id: 'bethlehem', name: { ar: 'بيت لحم', en: 'Bethlehem' }, region: 'west-bank', center: { lat: 31.7, lng: 35.2 } },
  { id: 'hebron', name: { ar: 'الخليل', en: 'Hebron' }, region: 'west-bank', center: { lat: 31.53, lng: 35.1 } },
  { id: 'north-gaza', name: { ar: 'شمال غزة', en: 'North Gaza' }, region: 'gaza', center: { lat: 31.54, lng: 34.5 } },
  { id: 'gaza', name: { ar: 'غزة', en: 'Gaza' }, region: 'gaza', center: { lat: 31.5, lng: 34.46 } },
  { id: 'deir-al-balah', name: { ar: 'دير البلح', en: 'Deir al-Balah' }, region: 'gaza', center: { lat: 31.42, lng: 34.35 } },
  { id: 'khan-yunis', name: { ar: 'خان يونس', en: 'Khan Yunis' }, region: 'gaza', center: { lat: 31.34, lng: 34.3 } },
  { id: 'rafah', name: { ar: 'رفح', en: 'Rafah' }, region: 'gaza', center: { lat: 31.28, lng: 34.25 } },
]

export const governorateById = (id: string) => governorates.find((g) => g.id === id)
