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
    if (!req.body || !req.body['new-username']) {
      throw new Error('invalid-new-username')
    }
    if (global.minimumUsernameLength > req.body['new-username'].length ||
      global.maximumUsernameLength < req.body['new-username'].length) {
      throw new Error('invalid-new-username-length')
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
    const usernameHash = await dashboard.Hash.sha512Hash(req.body['new-username'], dashboardEncryptionKey)
    await dashboard.Storage.Account.update({
      usernameHash,
      usernameLastChangedAt: new Date()
    }, {
      where: {
        accountid: req.query.accountid,
        appid: req.appid || global.appid
      }
    })
    await dashboard.StorageCache.remove(req.query.accountid)
    return global.api.user.Account.get(req)
  }
}
