// Edits a callback message's text, falling back to a fresh reply if the
// edit fails (message too old, not text, lost reply context, etc.).
// Keeps the user always informed.

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

module.exports = { safeEditMessage }
