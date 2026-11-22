type ClassValue = string | false | null | undefined | 0

/** Join conditional class names. */
export function cn(...classes: ClassValue[]) {
  return classes.filter(Boolean).join(' ')
}

/** Shared page width used across the public site. */
export const container = 'mx-auto w-[min(1180px,calc(100%-40px))]'
