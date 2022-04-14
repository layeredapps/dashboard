const dashboard = require('../../../../index.js')

module.exports = {
  patch: async (req) => {
    if (!req.query || !req.query.accountid) {
      throw new Error('invalid-accountid')
    }
    const account = await global.api.user.Account.get(req)
    if (!account) {
      throw new Error('invalid-accountid')
    }
    await dashboard.Storage.Account.update({
      sessionKey: dashboard.UUID.random(64),
      sessionKeyLastResetAt: new Date(),
      sessionKeyNumber: account.sessionKeyNumber++
    }, {
      where: {
        accountid: req.query.accountid
      }
    })
    await dashboard.StorageCache.remove(req.query.accountid)
    return true
  }
}
