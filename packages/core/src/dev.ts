/**
 * Development-time warnings for mistakes that would otherwise pass in silence:
 * a tour id that does not exist, a step whose target is not on the page.
 *
 * Written so bundlers can see and remove it: they replace
 * `process.env.NODE_ENV` literally, so a production build drops both the check
 * and the message. Without a bundler `process` is not defined, and the catch
 * treats that as development.
 */

/** Declared here because the engine builds without Node types. */
declare const process: { env: { NODE_ENV?: string } }

function isProduction(): boolean {
  try {
    return process.env.NODE_ENV === 'production'
  } catch {
    return false
  }
}

const said = new Set<string>()

/** Warn once per distinct message, so a repeating step does not fill the console. */
export function devWarn(message: string): void {
  if (isProduction() || said.has(message)) return
  said.add(message)
  console.warn(`[docent] ${message}`)
}
