/** Tonight's run of show, as it stands at 17:20. */

export type StoryState = 'draft' | 'review' | 'scheduled' | 'live'

export interface Story {
  id: string
  slot: string
  headline: string
  standfirst: string
  byline: string
  desk: string
  words: number
  time: string
  state: StoryState
}

export const stories: Story[] = [
  {
    id: 'st-401',
    slot: 'Lead',
    headline: 'Council backs the harbour plan after eighteen months of hearings',
    standfirst:
      'The vote was 31–9. Objectors say the ferry terminal was decided long before the consultation opened.',
    byline: 'Ines Duarte',
    desk: 'News',
    words: 1240,
    time: '18:00',
    state: 'scheduled',
  },
  {
    id: 'st-398',
    slot: 'Second',
    headline: 'The quiet collapse of the regional bus timetable',
    standfirst:
      'Four operators have cut evening services since April. We mapped every route that no longer runs after seven.',
    byline: 'Tomas Brenner',
    desk: 'News',
    words: 2180,
    time: '18:30',
    state: 'review',
  },
  {
    id: 'st-396',
    slot: 'Business',
    headline: 'Kestrel Bikes files for a listing it once called “a distraction”',
    standfirst: 'The prospectus puts a third of revenue with a single distributor.',
    byline: 'Ade Fashola',
    desk: 'Business',
    words: 860,
    time: '19:15',
    state: 'draft',
  },
  {
    id: 'st-394',
    slot: 'Culture',
    headline: 'A restorer, a forgery and forty years of doubt',
    standfirst:
      'The gallery has withdrawn the attribution. The restorer says she told them in 1986.',
    byline: 'Nell Okoro',
    desk: 'Culture',
    words: 1620,
    time: '20:00',
    state: 'draft',
  },
  {
    id: 'st-390',
    slot: 'Opinion',
    headline: 'Nobody asked for a smart bin',
    standfirst: 'The procurement papers are worth reading before the next round.',
    byline: 'Editorial board',
    desk: 'Opinion',
    words: 640,
    time: '17:00',
    state: 'live',
  },
]

export const desks = ['All desks', 'News', 'Business', 'Culture', 'Opinion', 'Sport']

export const checks = [
  { id: 'legal', label: 'Legal read', who: 'M. Farrow', done: true },
  { id: 'facts', label: 'Fact check', who: 'Desk', done: true },
  { id: 'photo', label: 'Photo rights', who: 'Picture desk', done: false },
  { id: 'push', label: 'Push copy written', who: 'Unassigned', done: false },
]
