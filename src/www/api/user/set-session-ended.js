const dashboard = require('../../../../index.js')

module.exports = {
  patch: async (req) => {
    if (!req.query || !req.query.sessionid) {
      throw new Error('invalid-sessionid')
    }
    const session = await global.api.user.Session.get(req)
    if (!session) {
      throw new Error('invalid-sessionid')
    }
    if (session.ended) {
      throw new Error('invalid-session')
    }
    if (session.accountid !== req.account.accountid) {
      throw new Error('invalid-account')
    }
    await dashboard.Storage.Session.update({
      endedAt: new Date()
    }, {
      where: {
        sessionid: req.query.sessionid
      }
    })
    await dashboard.StorageCache.remove(req.query.sessionid)
    return global.api.user.Session.get(req)
  }
}
