const Markup = require('telegraf/markup')


module.exports = async (ctx) => {
  if (!ctx.db.user) ctx.db.user = await ctx.db.User.findOne({ telegram_id: ctx.from.id })
  const stickerSet = await ctx.db.StickerSet.findById(ctx.match[2])

  let answerCbQuer = ''

  if (stickerSet.owner.toString() === ctx.db.user.id.toString()) {
    stickerSet.hide = stickerSet.hide !== true
    stickerSet.save()

    if (stickerSet.hide === true) {
      answerCbQuer = ctx.i18n.t('callback.pack.answerCbQuer.hidden')

      const userSet = await ctx.db.StickerSet.findOne({
        owner: ctx.db.user.id,
        create: true,
        hide: false,
      })

      ctx.db.user.stickerSet = userSet.id
      ctx.db.user.save()
    }
    else {
      answerCbQuer = ctx.i18n.t('callback.pack.answerCbQuer.restored')
    }
    ctx.answerCbQuery(answerCbQuer)

    ctx.editMessageReplyMarkup(Markup.inlineKeyboard([
      Markup.callbackButton(ctx.i18n.t(stickerSet.hide === true ? 'callback.pack.btn.restore' : 'callback.pack.btn.hide'), `hide_pack:${ctx.match[2]}`),
    ])).catch(() => {})
  }
}
