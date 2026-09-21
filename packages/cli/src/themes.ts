/**
 * The themes `docent theme add` installs by name, bundled into the CLI so it
 * works offline and a given CLI version always installs the same files.
 * `themes/` at the repo root is the source; a test keeps this list complete.
 */

import bloom from '../../../themes/bloom.json' with { type: 'json' }
import broadsheet from '../../../themes/broadsheet.json' with { type: 'json' }
import carbon from '../../../themes/carbon.json' with { type: 'json' }
import consoleTheme from '../../../themes/console.json' with { type: 'json' }
import ledger from '../../../themes/ledger.json' with { type: 'json' }
import nocturne from '../../../themes/nocturne.json' with { type: 'json' }
import quiet from '../../../themes/quiet.json' with { type: 'json' }

export type ThemeFile = Record<string, unknown> & { name?: string }

export const THEMES: Record<string, ThemeFile> = {
  bloom,
  broadsheet,
  carbon,
  console: consoleTheme,
  ledger,
  nocturne,
  quiet,
}
