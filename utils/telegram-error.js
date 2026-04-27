// Maps Telegram API errors to user-facing i18n keys under
// `error.telegram_reasons.*`. Patterns are ordered most-specific
// (longer / unambiguous identifier) → most-generic.

const ERROR_PATTERNS = [
  { match: /STICKER_INVALID|STICKER_NOT_FOUND/i, reason: 'sticker_not_in_set' },
  { match: /STICKERSET_INVALID|STICKERSET_NOT_FOUND/i, reason: 'pack_invalid' },
  { match: /STICKERS_TOO_MUCH/i, reason: 'pack_full' },
  { match: /STICKERSET_OWNER_ANOTHER/i, reason: 'not_pack_owner' },
  { match: /sticker set name is already occupied/i, reason: 'pack_name_taken' },
  { match: /PACK_SHORT_NAME_INVALID/i, reason: 'pack_name_invalid' },
  { match: /STICKER_PNG_NOPNG|STICKER_PNG_DIMENSIONS|STICKER_TGS_NOTGS|STICKER_VIDEO_NOWEBM|STICKER_VIDEO_BIG|STICKER_FILE_INVALID|STICKER_DOCUMENT_INVALID/i, reason: 'invalid_sticker_format' },
  { match: /STICKER_EMOJI_INVALID|EMOJI_INVALID/i, reason: 'invalid_emoji' },
  { match: /Too Many Requests|FLOOD_WAIT/i, reason: 'rate_limited' },
  { match: /^Forbidden|bot was blocked|user is deactivated|chat not found|PEER_ID_INVALID/i, reason: 'cannot_reach_user' }
]

const RATE_LIMIT_CODE = 429

const matchTelegramErrorReason = (error) => {
  if (!error) return null
  if (error.code === RATE_LIMIT_CODE) return 'rate_limited'
  const description = error.description || error.message || ''
  for (const { match, reason } of ERROR_PATTERNS) {
    if (match.test(description)) return reason
  }
  return null
}

const extractRetryAfterSeconds = (error) => {
  if (!error) return null
  // Telegram attaches `parameters.retry_after` on 429.
  const fromParams = error.parameters?.retry_after ?? error.response?.parameters?.retry_after
  if (Number.isFinite(fromParams)) return fromParams
  const description = error.description || error.message || ''
  const match = description.match(/FLOOD_WAIT_(\d+)/i) || description.match(/retry after (\d+)/i)
  return match ? parseInt(match[1], 10) : null
}

const humanizeTelegramError = (ctx, error, opts = {}) => {
  const reason = matchTelegramErrorReason(error)

  if (reason === 'rate_limited') {
    const seconds = extractRetryAfterSeconds(error)
    if (seconds) return ctx.i18n.t('error.rate_limit_seconds', { seconds })
    return ctx.i18n.t('error.telegram_reasons.rate_limited')
  }

  if (reason) return ctx.i18n.t(`error.telegram_reasons.${reason}`)

  const description = error?.description || error?.message || 'Unknown error'
  return ctx.i18n.t(opts.fallbackKey || 'error.telegram', { error: description })
}

module.exports = { matchTelegramErrorReason, extractRetryAfterSeconds, humanizeTelegramError }
