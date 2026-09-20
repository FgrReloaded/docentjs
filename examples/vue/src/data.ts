/** The page of an on-call console, frozen at 03:30. */

export type Severity = 1 | 2 | 3
export type IncidentState = 'firing' | 'acked' | 'resolved'

export interface Incident {
  id: string
  sev: Severity
  title: string
  service: string
  region: string
  started: string
  age: string
  state: IncidentState
  owner: string
  budget: string
  breached: boolean
}

export interface Event {
  time: string
  kind: 'alert' | 'action' | 'note'
  title: string
  detail: string
}

export const incidents: Incident[] = [
  {
    id: 'INC-2291',
    sev: 1,
    title: 'Checkout p99 latency over budget',
    service: 'checkout-api',
    region: 'eu-west-1',
    started: '03:12',
    age: '18m',
    state: 'firing',
    owner: 'Unassigned',
    budget: '2.4s / 1.2s',
    breached: true,
  },
  {
    id: 'INC-2290',
    sev: 2,
    title: 'Elevated 5xx from media-resizer',
    service: 'media-resizer',
    region: 'eu-west-1',
    started: '02:47',
    age: '43m',
    state: 'acked',
    owner: 'T. Okafor',
    budget: '3.1% / 1.0%',
    breached: true,
  },
  {
    id: 'INC-2288',
    sev: 3,
    title: 'Invoice queue depth rising',
    service: 'billing-worker',
    region: 'us-east-1',
    started: '01:58',
    age: '1h32m',
    state: 'firing',
    owner: 'Unassigned',
    budget: '8.2k / 5.0k',
    breached: true,
  },
  {
    id: 'INC-2286',
    sev: 2,
    title: 'TLS certificate expires in 71 hours',
    service: 'edge-proxy',
    region: 'global',
    started: 'Yesterday',
    age: '19h',
    state: 'acked',
    owner: 'M. Lindqvist',
    budget: '71h / 168h',
    breached: false,
  },
  {
    id: 'INC-2284',
    sev: 3,
    title: 'Disk 84% on shard-07',
    service: 'orders-db',
    region: 'eu-west-1',
    started: 'Yesterday',
    age: '22h',
    state: 'resolved',
    owner: 'T. Okafor',
    budget: '84% / 90%',
    breached: false,
  },
]

export const timelines: Record<string, Event[]> = {
  'INC-2291': [
    {
      time: '03:12',
      kind: 'alert',
      title: 'Alert fired',
      detail: 'checkout-latency · p99 2.41s over a 1.2s budget for 5 minutes',
    },
    {
      time: '03:12',
      kind: 'action',
      title: 'Paged platform-oncall',
      detail: 'Escalation policy “payments, out of hours”',
    },
    {
      time: '03:14',
      kind: 'action',
      title: 'Auto-mitigation shifted 30% of traffic',
      detail: 'eu-west-1 → eu-west-2 · p99 fell to 1.9s',
    },
    {
      time: '03:19',
      kind: 'note',
      title: 'Suspect deploy c4f19a',
      detail: 'Shipped 03:04 · “cache: drop per-request clone”',
    },
  ],
  'INC-2290': [
    {
      time: '02:47',
      kind: 'alert',
      title: 'Alert fired',
      detail: 'media-5xx · 3.1% of requests over a 1.0% budget',
    },
    {
      time: '02:51',
      kind: 'action',
      title: 'Acknowledged by T. Okafor',
      detail: 'Investigating the resize worker pool',
    },
  ],
  'INC-2288': [
    {
      time: '01:58',
      kind: 'alert',
      title: 'Alert fired',
      detail: 'billing-queue-depth · 8.2k messages over a 5k budget',
    },
  ],
  'INC-2286': [
    {
      time: 'Yesterday 08:02',
      kind: 'alert',
      title: 'Certificate expiry warning',
      detail: 'edge-proxy · *.cinder.dev expires in 71 hours',
    },
    {
      time: 'Yesterday 08:40',
      kind: 'action',
      title: 'Acknowledged by M. Lindqvist',
      detail: 'Renewal scheduled in the next maintenance window',
    },
  ],
  'INC-2284': [
    {
      time: 'Yesterday 05:10',
      kind: 'alert',
      title: 'Alert fired',
      detail: 'orders-db · shard-07 at 84% of volume',
    },
    {
      time: 'Yesterday 06:02',
      kind: 'action',
      title: 'Resolved by T. Okafor',
      detail: 'Old WAL segments pruned · 61% after cleanup',
    },
  ],
}

export const runbook = [
  { id: 'traffic', text: 'Confirm the shift held: traffic split should read 70/30.' },
  { id: 'deploy', text: 'Roll back the suspect deploy with ', code: 'cinder rollback c4f19a' },
  { id: 'cache', text: 'Warm the edge cache before returning traffic to eu-west-1.' },
]

export const dependencies = [
  { name: 'payments-gw', state: 'ok' as const },
  { name: 'cart-store', state: 'degraded' as const },
  { name: 'auth-edge', state: 'ok' as const },
  { name: 'ledger-api', state: 'ok' as const },
]

export const deploys = [
  { sha: 'c4f19a', at: '03:04', service: 'checkout-api', author: 'R. Adeyemi', suspect: true },
  { sha: '9b2e07', at: '01:20', service: 'cart-store', author: 'M. Lindqvist', suspect: false },
  { sha: '41ccd8', at: '23:48', service: 'checkout-api', author: 'T. Okafor', suspect: false },
]

/** p99 latency in milliseconds, one point a minute for the last half hour. */
export const latency = [
  880, 905, 890, 940, 910, 960, 1010, 980, 1040, 1120, 1180, 1260, 1410, 1680, 1980, 2240, 2380,
  2410, 2360, 2280, 2120, 1980, 1930, 1890, 1910, 1870, 1900, 1880, 1860, 1890,
]

export const latencyBudget = 1200
