import type { Role } from '@/types'

/*
 * Role-aware UI visibility.
 *
 * This only hides controls that a role cannot use — it is NOT access control. The backend enforces the
 * same rules (permission policy, ADR-0004: backend/src/modules/sources-provenance/permissions); keep the
 * two in step so nobody is shown a button that always answers 403.
 */
export const can = {
  manageUsers: (role?: Role) => role === 'admin',
  /** The change history: reviewers read it before they verify. */
  viewAuditLogs: (role?: Role) => role === 'admin' || role === 'reviewer',
  /** Verify or reject: reviewers and admins. Every signed-in role can see the queue. */
  reviewSubmissions: (role?: Role) => role === 'admin' || role === 'reviewer',
  /** Editing existing content: editors and admins (contributors can only add). */
  editContent: (role?: Role) => role === 'admin' || role === 'editor',
  /** Removing data: admins only. */
  deleteContent: (role?: Role) => role === 'admin',
}
