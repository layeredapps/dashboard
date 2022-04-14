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
    if (!req.body || !req.body['new-password']) {
      throw new Error('invalid-new-password')
    }
    if (global.minimumPasswordLength > req.body['new-password'].length ||
      global.maximumPasswordLength < req.body['new-password'].length) {
      throw new Error('invalid-new-password-length')
    }
    if (!req.body.password || !req.body.password.length) {
      throw new Error('invalid-password')
    }
    let dashboardEncryptionKey = global.dashboardEncryptionKey
    if (req.server) {
      dashboardEncryptionKey = req.server.dashboardEncryptionKey || dashboardEncryptionKey
    }
    const validPassword = await dashboard.Hash.bcryptHashCompare(req.body.password, accountInfo.dataValues.passwordHash, dashboardEncryptionKey)
    if (!validPassword) {
      throw new Error('invalid-password')
    }
    const newPasswordHash = await dashboard.Hash.bcryptHashHash(req.body['new-password'], dashboardEncryptionKey)
    await dashboard.Storage.Account.update({
      passwordHash: newPasswordHash,
      passwordLastChangedAt: new Date()
    }, {
      where: {
        accountid: req.query.accountid
      }
    })
    await dashboard.StorageCache.remove(req.query.accountid)
    return global.api.user.Account.get(req)
  }
}
