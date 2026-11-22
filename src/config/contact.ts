/** Public contact details of the Qaryati team, shown in the footer and on the account help pages. */
export const contact = {
  email: 'mohammad.marei.ps@outlook.com',
  /** Local Palestinian mobile number as written, and the international form used for `tel:` links. */
  phone: '0597327232',
  phoneIntl: '+970597327232',
  location: { en: 'Nablus, Palestine', ar: 'نابلس، فلسطين' },
} as const

export function mailtoContact(subject: string): string {
  return `mailto:${contact.email}?subject=${encodeURIComponent(subject)}`
}
