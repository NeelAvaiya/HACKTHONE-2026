// Pure function: free text -> module key, so someone can type "salary issue"
// instead of tapping the Payroll chip. Returns null when nothing matches.
import { categories } from '../data/team.js'

export const MODULE_CHIPS = categories.map((c) => c.key)

// Aliases cover all three languages in Latin script, so "salary", "vetan" and
// "tankhwah" all land on Payroll. The module keys are product menu names and
// stay in English.
const MODULE_ALIASES = {
  Payroll: ['payroll', 'salary', 'payslip', 'pf', 'compliance', 'tax', 'vetan', 'tankhwah'],
  HRMS: ['hrms', 'attendance', 'leave', 'shift', 'onboarding', 'hr', 'chhutti', 'chutti', 'haazri', 'hazri'],
  PMS: ['pms', 'performance', 'appraisal', 'goal', 'review', 'mulyankan'],
  Other: ['other', 'login', 'mobile', 'app', 'integration', 'sso', 'platform', 'anya'],
}

export function matchModule(text) {
  const lower = String(text || '').toLowerCase()
  return MODULE_CHIPS.find((key) => MODULE_ALIASES[key].some((alias) => lower.includes(alias))) || null
}
