// Release notes seeded into MongoDB on first run. Whatever the team ships gets a note
// here (or via POST /api/releases) and every client is notified inside their chat.
// notified:false = the client has not been told yet → the chat delivers it on load.
export const releases = [
  {
    id: 'REL-2026.08.01',
    version: 'v4.12.0',
    title: 'Payslip PDF download fixed for FY 2025-26',
    type: 'fix',
    status: 'live',
    modules: ['Payroll'],
    highlights: [
      'Payslips from before April 2025 open again without changing the year filter',
      'Blank-PDF issue on Chrome 130+ resolved',
      'Bulk export now includes all selected employees, not just the first page',
    ],
    affected:
      'Anyone who downloaded payslips for FY 2024-25 or earlier. Re-download any slip that came out blank — no need to raise a fresh ticket.',
    fixesTickets: ['SUP-1031', 'SUP-1042'],
    releasedAt: '2026-08-01T04:30:00.000Z',
    notified: false,
  },
  {
    id: 'REL-2026.07.24',
    version: 'v4.11.2',
    title: 'Regularisation requests now clear in one approval',
    type: 'enhancement',
    status: 'live',
    modules: ['Attendance'],
    highlights: [
      'Reporting manager approval is enough — the second HR approval step is gone',
      'Bulk approve up to 50 requests from Attendance → Regularisation',
      'Employees get the approval mail within a minute instead of the nightly batch',
    ],
    affected:
      'Managers and HR admins approving attendance regularisation. Pending requests raised before this release were migrated automatically.',
    fixesTickets: ['SUP-1039'],
    releasedAt: '2026-07-24T11:00:00.000Z',
    notified: true,
  },
  {
    id: 'REL-2026.07.10',
    version: 'v4.11.0',
    title: 'Goal check-ins added to PMS',
    type: 'feature',
    status: 'live',
    modules: ['PMS'],
    highlights: [
      'Monthly check-in against every goal, visible to the employee and their manager',
      'Check-in history carries into the appraisal form automatically',
      'Reminders go out 3 days before each check-in is due',
    ],
    affected:
      'All employees with active goals. Nothing to configure — check-ins appear under PMS → My Goals from this cycle onwards.',
    fixesTickets: [],
    releasedAt: '2026-07-10T09:15:00.000Z',
    notified: true,
  },
]
