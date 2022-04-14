const dashboard = require('./index.js')

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
        const now = new Date()
        const days = req.query.days || 1
        const updateClause = {
          lastVerifiedAt: new Date(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - days, now.getUTCHours(), now.getUTCMinutes(), now.getUTCSeconds())
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
