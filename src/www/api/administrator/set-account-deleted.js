const dashboard = require('../../../../index.js')

module.exports = {
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
    const now = new Date()
    const updateClause = {
      deletedAt: new Date(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + global.deleteDelay, now.getUTCHours(), now.getUTCMinutes(), now.getUTCSeconds())
    }
    await dashboard.Storage.Account.update(updateClause, {
      where: {
        accountid: req.query.accountid
      }
    })
    await dashboard.StorageCache.remove(req.query.accountid)
    return global.api.administrator.Account.get(req)
  }
}
