// Static scenario for the auto-assignment preview. Nothing here touches the real
// booking flow or the database — it exists to show what the system does when the
// requested expert is not free.
//
// Cell states: 'free' | 'busy' | 'taken' (the conflict) | 'booked' (the result)

export const autoAssignDemo = {
  request: {
    client: 'Rohit Verma',
    company: 'FinEdge Solutions',
    category: 'Payroll',
    time: '9:00 AM',
    day: 'Today',
  },

  times: ['9:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', '2:00 PM'],

  // `eligible` marks who can take a Payroll query at all
  experts: [
    { name: 'Priya Nair', role: 'Payroll · PMS', eligible: true, slots: ['taken', 'busy', 'busy', 'busy', 'free'] },
    { name: 'Amit Deshmukh', role: 'Payroll · Compliance', eligible: true, slots: ['free', 'busy', 'free', 'busy', 'busy'] },
    { name: 'Kavya Reddy', role: 'HRMS · Attendance', eligible: false, slots: ['busy', 'busy', 'free', 'busy', 'free'] },
    { name: 'Rohit Sharma', role: 'Platform · SSO', eligible: false, slots: ['free', 'busy', 'free', 'free', 'busy'] },
  ],

  // Each step lights up one part of the grid and narrates what is happening
  steps: [
    {
      title: 'Request received',
      detail: 'Rohit asks for a Payroll call at 9:00 AM today.',
      highlight: null,
      status: 'pending',
    },
    {
      title: 'First match is not free',
      detail: 'Priya Nair is the best Payroll match, but her 9:00 AM is already booked.',
      highlight: 'Priya Nair',
      status: 'conflict',
    },
    {
      title: 'Checking the rest of the team',
      detail: 'Only Payroll-skilled experts are considered — Kavya and Rohit are skipped.',
      highlight: null,
      status: 'scanning',
    },
    {
      title: 'Booked automatically',
      detail: 'Amit Deshmukh is free at 9:00 AM and has the lighter day, so the call is booked with him.',
      highlight: 'Amit Deshmukh',
      status: 'assigned',
    },
  ],

  result: {
    expert: 'Amit Deshmukh',
    time: '9:00 AM',
    day: 'Today',
    note: 'No second message needed — the client keeps the time they asked for.',
  },
}

export const autoAssignCopy = {
  title: 'Automatic reassignment',
  intro:
    'When the matched expert is busy at the time a client asks for, the booking moves to another expert with the same skills instead of sending the client back to pick again. This is a preview with sample data.',
  run: 'Run the scenario',
  replay: 'Play again',
  previewBadge: 'Preview · sample data',
  legend: { free: 'Available', busy: 'Blocked', taken: 'Already booked', booked: 'Auto-assigned' },
  skipped: 'Not a Payroll expert — skipped',
}
