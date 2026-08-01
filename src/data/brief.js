// Pre-meeting brief shown on Dashboard → Tab 3 — generated "by the bot" before a booked call
export const brief = {
  meetingWith: 'Rohit Verma (HR Head, FinEdge Solutions)',
  supportPerson: 'Priya Nair',
  scheduledFor: 'Today, 4:30 PM IST · Google Meet',
  client: 'FinEdge Solutions',
  issueSummary:
    'Payslip PDFs for March fail to download for ~40 employees. Client attempted self-serve fix (filter + pop-up blocker) without success. Likely related to the FY filter migration released last week.',
  module: 'Payroll',
  pastTickets: [
    { id: 'SUP-1031', title: 'Payslip PDF download failing for March', status: 'In Progress' },
    { id: 'SUP-1039', title: 'Form 16 generation throwing "TAN not configured"', status: 'Resolved' },
    { id: 'SUP-1035', title: 'Leave balance wrong carry-forward after year close', status: 'Open' },
  ],
  suggestedPlan: [
    'Confirm whether affected employees are all in the FY 2025-26 migrated batch',
    'Share the hotfix ETA (deployed to staging, prod push tonight) and offer bulk PDF export as a workaround',
    'Reassure on the repeat issue — link SUP-1031 thread so client sees active progress',
  ],
  sentiment: 'Frustrated — 2nd occurrence of a payroll-document issue this quarter',
}
