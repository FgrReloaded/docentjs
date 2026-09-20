/** Realistic-looking receivables. Static on purpose: the app is a demo shell. */

export interface Invoice {
  ref: string
  client: string
  initials: string
  issued: string
  due: string
  daysLate: number
  status: 'overdue' | 'sent' | 'paid' | 'draft'
  amount: number
}

export const invoices: Invoice[] = [
  {
    ref: '1042',
    client: 'Vestre & Hall',
    initials: 'VH',
    issued: '4 Aug',
    due: '3 Sep',
    daysLate: 17,
    status: 'overdue',
    amount: 12400,
  },
  {
    ref: '1041',
    client: 'Northbank Coffee',
    initials: 'NC',
    issued: '29 Jul',
    due: '28 Aug',
    daysLate: 23,
    status: 'overdue',
    amount: 3850,
  },
  {
    ref: '1040',
    client: 'Marlowe Dental',
    initials: 'MD',
    issued: '2 Sep',
    due: '2 Oct',
    daysLate: 0,
    status: 'sent',
    amount: 9600,
  },
  {
    ref: '1039',
    client: 'Kestrel Bikes',
    initials: 'KB',
    issued: '28 Aug',
    due: '27 Sep',
    daysLate: 0,
    status: 'sent',
    amount: 21750,
  },
  {
    ref: '1038',
    client: 'Pell Architects',
    initials: 'PA',
    issued: '19 Aug',
    due: '18 Sep',
    daysLate: 2,
    status: 'overdue',
    amount: 5230,
  },
  {
    ref: '1037',
    client: 'Ondra Studio',
    initials: 'OS',
    issued: '11 Aug',
    due: '10 Sep',
    daysLate: 0,
    status: 'paid',
    amount: 7400,
  },
  {
    ref: '1036',
    client: 'Halden Foods',
    initials: 'HF',
    issued: '6 Aug',
    due: '5 Sep',
    daysLate: 0,
    status: 'paid',
    amount: 18900,
  },
  {
    ref: '1043',
    client: 'Two Rivers Press',
    initials: 'TR',
    issued: '—',
    due: '—',
    daysLate: 0,
    status: 'draft',
    amount: 4600,
  },
  {
    ref: '1035',
    client: 'Bramble & Sons',
    initials: 'BS',
    issued: '30 Jul',
    due: '29 Aug',
    daysLate: 22,
    status: 'overdue',
    amount: 2140,
  },
  {
    ref: '1034',
    client: 'Quayside Ferries',
    initials: 'QF',
    issued: '25 Aug',
    due: '24 Sep',
    daysLate: 0,
    status: 'sent',
    amount: 14300,
  },
  {
    ref: '1033',
    client: 'Lune Valley Hotel',
    initials: 'LV',
    issued: '21 Aug',
    due: '20 Sep',
    daysLate: 0,
    status: 'sent',
    amount: 6480,
  },
  {
    ref: '1032',
    client: 'Arden Optics',
    initials: 'AO',
    issued: '14 Aug',
    due: '13 Sep',
    daysLate: 0,
    status: 'paid',
    amount: 5900,
  },
  {
    ref: '1044',
    client: 'Selby Cycles',
    initials: 'SC',
    issued: '—',
    due: '—',
    daysLate: 0,
    status: 'draft',
    amount: 2750,
  },
]

/** Receivables split by how long they have been outstanding. */
export const aging = [
  { band: 'Current', amount: 31350, tone: 'oklch(72% 0.06 155)' },
  { band: '1–30 days', amount: 17630, tone: 'oklch(58% 0.075 155)' },
  { band: '31–60 days', amount: 9420, tone: 'oklch(46% 0.085 155)' },
  { band: '60+ days', amount: 4810, tone: 'oklch(50% 0.145 38)' },
]

export const activity = [
  { time: '09:12', text: 'Payment received', detail: 'Halden Foods · £18,900' },
  { time: '08:40', text: 'Reminder sent', detail: 'Vestre & Hall · second notice' },
  { time: 'Yesterday', text: 'Invoice 1040 viewed', detail: 'Marlowe Dental · twice' },
  { time: 'Mon', text: 'Retainer renewed', detail: 'Kestrel Bikes · 12 months' },
]

export const money = new Intl.NumberFormat('en-GB', {
  style: 'currency',
  currency: 'GBP',
  maximumFractionDigits: 0,
})
