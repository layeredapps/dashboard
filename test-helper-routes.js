const dashboard = require('./index.js')
const sequelize = require('sequelize')

module.exports = {
  requireVerification: {
    api: {
      patch: async (req) => {
        if (process.env.NODE_ENV !== 'testing') {
          throw new Error('invalid-route')
        }
        if (!req.query || !req.query.sessionid) {
          throw new Error('invalid-sessionid')
        }
        if (req.query.sessionid !== req.session.sessionid) {
          throw new Error('invalid-session')
        }
        const days = req.query.days || 1
        const updateClause = {}
        if (!process.env.STORAGE || process.env.STORAGE === 'sqlite') {
          updateClause.lastVerifiedAt = sequelize.fn('datetime', sequelize.literal('CURRENT_TIMESTAMP'), `-${days} days`)
        } else if (process.env.STORAGE === 'postgresql') {
          updateClause.lastVerifiedAt = sequelize.literal(`NOW() - interval '${days}d'`)
        } else if (process.env.STORAGE === 'mariadb' || process.env.STORAGE === 'mysql') {
          updateClause.lastVerifiedAt = sequelize.literal(`date_add(NOW(), interval -${global.deleteDelay} day)`)
        }
        await dashboard.Storage.Session.update(updateClause, {
          where: {
            sessionid: req.query.sessionid
          }
        })
        await dashboard.StorageCache.remove(req.query.sessionid)
        return global.api.user.Session.get(req)
      }
    }
  }
}
