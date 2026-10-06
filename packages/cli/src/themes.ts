/**
 * The themes `docent theme add` installs by name, bundled into the CLI so it
 * works offline and a given CLI version always installs the same files.
 * `themes/` at the repo root is the source; a test keeps this list complete.
 */

import atelier from '../../../themes/atelier.json' with { type: 'json' }
import aurora from '../../../themes/aurora.json' with { type: 'json' }
import bloom from '../../../themes/bloom.json' with { type: 'json' }
import broadsheet from '../../../themes/broadsheet.json' with { type: 'json' }
import carbon from '../../../themes/carbon.json' with { type: 'json' }
import concrete from '../../../themes/concrete.json' with { type: 'json' }
import consoleTheme from '../../../themes/console.json' with { type: 'json' }
import frost from '../../../themes/frost.json' with { type: 'json' }
import graphite from '../../../themes/graphite.json' with { type: 'json' }
import ledger from '../../../themes/ledger.json' with { type: 'json' }
import neon from '../../../themes/neon.json' with { type: 'json' }
import nocturne from '../../../themes/nocturne.json' with { type: 'json' }
import pebble from '../../../themes/pebble.json' with { type: 'json' }
import poster from '../../../themes/poster.json' with { type: 'json' }
import quiet from '../../../themes/quiet.json' with { type: 'json' }
import slate from '../../../themes/slate.json' with { type: 'json' }
import velvet from '../../../themes/velvet.json' with { type: 'json' }

export type ThemeFile = Record<string, unknown> & { name?: string }

export const THEMES: Record<string, ThemeFile> = {
  atelier,
  aurora,
  bloom,
  broadsheet,
  carbon,
  concrete,
  console: consoleTheme,
  frost,
  graphite,
  ledger,
  neon,
  nocturne,
  pebble,
  poster,
  quiet,
  slate,
  velvet,
}
