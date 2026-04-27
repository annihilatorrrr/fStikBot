// Minimal structured logger — no external deps, drop-in replacement
// for console.{log,error,warn,debug}. Adds:
//   - ISO timestamp on every line
//   - explicit level (ERROR/WARN/INFO/DEBUG)
//   - optional scope prefix per call site
//
// Why no winston/pino: single-process bot, log volume is moderate,
// PM2 collects stdout/stderr already. Keeping zero deps means no
// surprise behavior at startup. Migration to a heavier lib later is
// a one-import-swap because we expose the same .error/.warn/.info/.debug
// shape.

const LEVELS = ['error', 'warn', 'info', 'debug']

const requestedLevel = (process.env.LOG_LEVEL || 'info').toLowerCase()
const currentLevelIdx = (() => {
  const idx = LEVELS.indexOf(requestedLevel)
  return idx === -1 ? LEVELS.indexOf('info') : idx
})()

const noop = () => {}

const formatPrefix = (level, scope) => {
  const ts = new Date().toISOString()
  const tag = `[${ts}] [${level.toUpperCase()}]`
  return scope ? `${tag} [${scope}]` : tag
}

const make = (scope) => {
  const out = {}
  LEVELS.forEach((level, idx) => {
    if (idx > currentLevelIdx) {
      out[level] = noop
      return
    }
    const sink = level === 'error'
      ? console.error
      : level === 'warn'
        ? console.warn
        : console.log
    out[level] = (...args) => sink(formatPrefix(level, scope), ...args)
  })
  // Allow caller to derive a sub-logger with a more specific scope.
  out.scope = (childScope) => make(scope ? `${scope}:${childScope}` : childScope)
  return out
}

module.exports = make()
