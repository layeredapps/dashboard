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
    let deletedAt
    if (global.deleteDelay) {
      deletedAt = new Date(now.getFullYear(), now.getMonth(), now.getDate() + global.deleteDelay, now.getHours(), now.getMinutes(), now.getSeconds())
    } else {
      deletedAt = now
    }
    const updateClause = {
      deletedAt
    }
    await dashboard.Storage.Account.update(updateClause, {
      where: {
        accountid: req.query.accountid,
        appid: req.appid || global.appid
      }
    })
    await dashboard.StorageCache.remove(req.query.accountid)
    return global.api.administrator.Account.get(req)
  }
}
