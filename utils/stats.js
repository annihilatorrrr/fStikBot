const io = require('@pm2/io')

const stats = {
  rpsAvrg: 0,
  responseTimeAvrg: 0,
  times: {}
}

const rtOP = io.metric({
  name: 'response time',
  unit: 'ms'
})

// const usersCountIO = io.metric({
//   name: 'Users count',
//   unit: 'user'
// })

// .unref() so this stats sampler doesn't keep the process alive on shutdown.
setInterval(() => {
  const keys = Object.keys(stats.times)

  // Prevent memory accumulation: clean up old entries if too many
  if (keys.length > 60) {
    const keysToDelete = keys.slice(0, keys.length - 60)
    keysToDelete.forEach(key => delete stats.times[key])
  }

  if (keys.length > 1) {
    const time = keys[0]

    const rps = stats.times[time].length
    if (stats.rpsAvrg > 0) stats.rpsAvrg = (stats.rpsAvrg + rps) / 2
    else stats.rpsAvrg = rps

    const sumResponseTime = stats.times[time].reduce((a, b) => a + b, 0)
    const lastResponseTimeAvrg = (sumResponseTime / stats.times[time].length) || 0
    if (stats.responseTimeAvrg > 0) stats.responseTimeAvrg = (stats.responseTimeAvrg + lastResponseTimeAvrg) / 2
    else stats.responseTimeAvrg = lastResponseTimeAvrg

    console.log('🔄 rps last:', rps)
    console.log('🔄 rps avrg:', stats.rpsAvrg)
    console.log('🔄 response time avrg last:', lastResponseTimeAvrg)
    console.log('🔄 response time avrg total:', stats.responseTimeAvrg)

    rtOP.set(stats.responseTimeAvrg)

    delete stats.times[time]
  }
}, 1000).unref()

// setInterval(async () => {
//   const usersCount = await db.User.count({
//     updatedAt: {
//       $gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
//     }
//   })

//   usersCountIO.set(usersCount)
// }, 60 * 1000)

module.exports = async (ctx, next) => {
  const startMs = new Date()

  ctx.stats = {
    rps: stats.rpsAvrg,
    rta: stats.responseTimeAvrg
  }

  return next().then(() => {
    const now = Math.floor(new Date() / 1000)

    if (!stats.times[now]) stats.times[now] = []
    stats.times[now].push(new Date() - startMs)
  })
}
