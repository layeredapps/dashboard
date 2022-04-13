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
          accountid: req.query.accountid
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
    const deletedAt = new Date(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + global.deleteDelay, now.getUTCHours(), now.getUTCMinutes(), now.getUTCSeconds())
    const updateClause = {
      deletedAt
    }
    await dashboard.Storage.Account.update(updateClause, {
      where: {
        accountid: req.query.accountid
      }
    })
    await dashboard.StorageCache.remove(req.query.accountid)
    return global.api.user.Account.get(req)
  }
}
