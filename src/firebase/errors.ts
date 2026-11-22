import { FirebaseError } from 'firebase/app'

/** A refusal the app raises itself (e.g. a record that is no longer there), shown like a Firebase error. */
export class AppError extends Error {
  readonly code: string
  constructor(code: string, message: string) {
    super(message)
    this.name = 'AppError'
    this.code = code
  }
}

const MESSAGES: Record<string, string> = {
  'permission-denied': 'You do not have permission for this change · لا تملك صلاحية لهذا التعديل',
  unavailable: 'The database cannot be reached. Check your connection · تعذّر الوصول إلى قاعدة البيانات، تحقّق من الاتصال',
  'not-found': 'This record no longer exists · هذا السجل لم يعد موجودًا',
  'failed-precondition': 'The database refused the change · رفضت قاعدة البيانات التعديل',
  unauthenticated: 'Please sign in again · يرجى تسجيل الدخول من جديد',
  'resource-exhausted': 'Too many requests, try again shortly · طلبات كثيرة، حاول بعد قليل',
}

/** A message to show for a failed action. */
export function errorMessage(error: unknown): string {
  if (error instanceof AppError) return error.message
  if (error instanceof FirebaseError) {
    const code = error.code.replace(/^firestore\//, '')
    return MESSAGES[code] ?? error.message
  }
  return error instanceof Error ? error.message : 'Unexpected error · خطأ غير متوقع'
}
