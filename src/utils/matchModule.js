// Pure function: free text -> module key, so someone can type "salary issue"
// instead of tapping the Payroll chip. Returns null when nothing matches.
import { categories } from '../data/team.js'

export const MODULE_CHIPS = categories.map((c) => c.key)

const MODULE_ALIASES = {
  Payroll: ['payroll', 'salary', 'payslip', 'pf', 'compliance', 'tax'],
  HRMS: ['hrms', 'attendance', 'leave', 'shift', 'onboarding', 'hr'],
  PMS: ['pms', 'performance', 'appraisal', 'goal', 'review'],
  Other: ['other', 'login', 'mobile', 'app', 'integration', 'sso', 'platform'],
}

export function matchModule(text) {
  const lower = String(text || '').toLowerCase()
  return MODULE_CHIPS.find((key) => MODULE_ALIASES[key].some((alias) => lower.includes(alias))) || null
}
