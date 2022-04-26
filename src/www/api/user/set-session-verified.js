const dashboard = require('../../../../index.js')

module.exports = {
  patch: async (req) => {
    if (!req.query || !req.query.sessionid) {
      throw new Error('invalid-sessionid')
    }
    const session = await global.api.user.Session.get(req)
    if (session.accountid !== req.account.accountid) {
      throw new Error('invalid-account')
    }
    if (req.session.sessionid !== req.query.sessionid) {
      throw new Error('invalid-session')
    }
    if (!req || !req.body) {
      throw new Error('invalid-username')
    }
    if (!req.body.username || !req.body.username.length) {
      throw new Error('invalid-username')
    }
    if (!req.body.password || !req.body.password.length) {
      throw new Error('invalid-password')
    }
    if (global.minimumUsernameLength > req.body.username.length) {
      throw new Error('invalid-username-length')
    }
    if (global.minimumPasswordLength > req.body.password.length) {
      throw new Error('invalid-password-length')
    }
    let dashboardEncryptionKey = global.dashboardEncryptionKey
    if (req.server) {
      dashboardEncryptionKey = req.server.dashboardEncryptionKey || dashboardEncryptionKey
    }
    const usernameHash = await dashboard.Hash.sha512Hash(req.body.username, dashboardEncryptionKey)
    const accountInfo = await dashboard.Storage.Account.findOne({
      where: {
        usernameHash,
        appid: req.appid || global.appid
      }
    })
    if (!accountInfo) {
      throw new Error('invalid-username')
    }
    if (accountInfo.dataValues.accountid !== req.account.accountid) {
      throw new Error('invalid-username')
    }
    const validPassword = await dashboard.Hash.bcryptHashCompare(req.body.password, accountInfo.dataValues.passwordHash, dashboardEncryptionKey)
    if (!validPassword) {
      throw new Error('invalid-password')
    }
    await dashboard.Storage.Session.update({
      lastVerifiedAt: new Date()
    }, {
      where: {
        sessionid: req.session.sessionid,
        appid: req.appid || global.appid
      }
    })
    await dashboard.StorageCache.remove(req.query.sessionid)
    req.session = await global.api.user.Session.get(req)
    return req.session
  }
}
