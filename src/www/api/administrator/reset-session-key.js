const dashboard = require('../../../../index.js')

module.exports = {
  /**
   * End all of a user's sessions by generating a new
   * session key that invalidates all previous sessions
   */
  patch: async (req) => {
    if (!req.query || !req.query.accountid) {
      throw new Error('invalid-accountid')
    }
    const account = await global.api.administrator.Account.get(req)
    if (!account) {
      throw new Error('invalid-accountid')
    }
    if (account.deletedAt) {
      throw new Error('invalid-account')
    }
    await dashboard.Storage.Account.update({
      sessionKey: dashboard.UUID.random(64),
      sessionKeyLastResetAt: new Date(),
      sessionKeyNumber: account.sessionKeyNumber + 1
    }, {
      where: {
        accountid: req.query.accountid,
        appid: req.appid || global.appid
      }
    })
    await dashboard.StorageCache.remove(req.query.accountid)
    return global.api.administrator.Account.get(req)
  }
}
