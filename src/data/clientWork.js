// Static tickets and feature requests raised by the demo client.
// Deliberately in-memory only: nothing here is persisted or fetched.
export const clientWorkSeed = [
  {
    id: 'SUP-1042',
    kind: 'ticket',
    title: 'Payslip PDF downloads blank for March',
    module: 'Payroll',
    tag: 'P2',
    raised: '2 days ago',
    status: 'open',
    notified: false,
  },
  {
    id: 'SUP-1039',
    kind: 'ticket',
    title: 'Attendance regularisation not reflecting for night shift',
    module: 'HRMS',
    tag: 'P3',
    raised: '5 days ago',
    status: 'open',
    notified: false,
  },
  {
    id: 'SUP-1031',
    kind: 'ticket',
    title: 'SSO login loops back to the sign-in page',
    module: 'Other',
    tag: 'P1',
    raised: '1 week ago',
    status: 'open',
    notified: false,
  },
  {
    id: 'FR-208',
    kind: 'fr',
    title: 'Send payslips on WhatsApp every month',
    module: 'Payroll',
    tag: '24 votes',
    raised: '3 weeks ago',
    status: 'open',
    notified: false,
  },
  {
    id: 'FR-197',
    kind: 'fr',
    title: 'Custom approval chains for leave requests',
    module: 'HRMS',
    tag: '11 votes',
    raised: '1 month ago',
    status: 'open',
    notified: false,
  },
]

export const KIND_LABEL = { ticket: 'ticket', fr: 'feature request' }
export const KIND_LABEL_PLURAL = { ticket: 'tickets', fr: 'feature requests' }
