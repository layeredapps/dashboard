const dashboard = require('../../../../index.js')

module.exports = {
  patch: async (req) => {
    if (!req.query || !req.query.accountid) {
      throw new Error('invalid-accountid')
    }
    let accountInfo
    try {
      accountInfo = await dashboard.Storage.Account.findOne({
        where: {
          accountid: req.query.accountid,
          appid: req.appid || global.appid
        }
      })
    } catch (error) {
    }
    if (!accountInfo) {
      throw new Error('invalid-accountid')
    }
    if (accountInfo.dataValues.accountid !== req.account.accountid) {
      throw new Error('invalid-account')
    }
    let dashboardEncryptionKey = global.dashboardEncryptionKey
    if (req.server) {
      dashboardEncryptionKey = req.server.dashboardEncryptionKey || dashboardEncryptionKey
    }
    if (!req.body || !req.body.password || !req.body.password.length) {
      throw new Error('invalid-password')
    }
    const validPassword = await dashboard.Hash.bcryptHashCompare(req.body.password, accountInfo.dataValues.passwordHash, dashboardEncryptionKey)
    if (!validPassword) {
      throw new Error('invalid-password')
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
    return global.api.user.Account.get(req)
  }
}
