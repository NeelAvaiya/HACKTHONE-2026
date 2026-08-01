// 4 support team members with skills, categories + day-wise busy times — used for routing & booking
// busy: day offset (0 = today, 1 = tomorrow, ...) → times occupied that day; unlisted day = fully free
export const categories = [
  { key: 'HRMS', desc: 'Attendance, leave, shifts, onboarding' },
  { key: 'Payroll', desc: 'Salary, payslips, PF, compliance' },
  { key: 'PMS', desc: 'Goals, appraisals, performance reviews' },
  { key: 'Other', desc: 'Login, mobile app, integrations & more' },
]

// Business hours: 9 AM – 6 PM IST, hourly slots, 1 PM kept free for lunch
export const timeSlots = ['9:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM']

export const team = [
  {
    name: 'Amit Deshmukh',
    skills: ['Payroll', 'Compliance'],
    categories: ['Payroll'],
    status: 'busy',
    nextFreeSlot: 'Today 11:00 AM',
    onCall: true,
    busy: {
      0: ['10:00 AM', '12:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM'],
      1: ['10:00 AM', '12:00 PM', '2:00 PM'],
      2: ['3:00 PM', '4:00 PM'],
    },
  },
  {
    name: 'Priya Nair',
    skills: ['Payroll', 'PMS'],
    categories: ['Payroll', 'PMS'],
    status: 'free',
    nextFreeSlot: 'Today 9:00 AM',
    onCall: false,
    busy: {
      0: ['10:00 AM', '11:00 AM', '12:00 PM'],
      1: ['9:00 AM', '10:00 AM', '11:00 AM'],
      3: ['2:00 PM', '3:00 PM'],
    },
  },
  {
    name: 'Kavya Reddy',
    skills: ['Attendance', 'Leave Management'],
    categories: ['HRMS'],
    status: 'busy',
    nextFreeSlot: 'Today 5:00 PM',
    onCall: false,
    busy: {
      0: ['9:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', '2:00 PM', '3:00 PM', '4:00 PM'],
      1: ['12:00 PM', '2:00 PM', '5:00 PM'],
      2: ['10:00 AM'],
    },
  },
  {
    name: 'Rohit Sharma',
    skills: ['Platform', 'SSO', 'Mobile App'],
    categories: ['HRMS', 'Other'],
    status: 'free',
    nextFreeSlot: 'Today 9:00 AM',
    onCall: false,
    busy: {
      0: ['10:00 AM', '2:00 PM', '3:00 PM'],
      1: ['11:00 AM', '4:00 PM'],
      4: ['10:00 AM', '11:00 AM'],
    },
  },
]
