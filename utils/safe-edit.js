// Edits a callback message's text, falling back to a fresh reply if the
// edit fails (message too old, not text, lost reply context, etc.).
// Keeps the user always informed.

const isBenignEditError = (err) => {
  const desc = err?.description || err?.message || ''
  // "message is not modified" — same content, no-op edit. Common when
  // admins click "refresh" on a status panel that hasn't changed.
  return /message is not modified/i.test(desc)
}

// Edit-or-tolerate-no-op. Use for status panels that may be re-rendered
// with identical content. Logs anything that *isn't* the not-modified
// case so real failures stay visible.
const tolerantEditMessage = async (ctx, text, options = {}) => {
  try {
    await ctx.editMessageText(text, options)
  } catch (err) {
    if (!isBenignEditError(err)) {
      console.error('tolerantEditMessage failed:', err.message)
    }
  }
}

const safeEditMessage = async (ctx, text, options = {}) => {
  try {
    await ctx.editMessageText(text, options)
    return { edited: true }
  } catch (err) {
    console.error('safeEditMessage: edit failed, falling back to reply:', err.message)
    try {
      await ctx.reply(text, {
        ...options,
        reply_to_message_id: ctx.callbackQuery?.message?.message_id,
        allow_sending_without_reply: true
      })
      return { edited: false, replied: true }
    } catch (replyErr) {
      console.error('safeEditMessage: reply fallback also failed:', replyErr.message)
      return { edited: false, replied: false }
    }
  }
}

module.exports = { safeEditMessage, tolerantEditMessage, isBenignEditError }
