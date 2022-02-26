const dashboard = require('../../../../index.js')

module.exports = {
  auth: false,
  patch: async (req) => {
    if (!req.body) {
      throw new Error('invalid-username')
    }
    if (!req.body.username) {
      throw new Error('invalid-username')
    }
    if (!req.body.username || !req.body.username.length) {
      throw new Error('invalid-username')
    }
    if (global.minimumUsernameLength > req.body.username.length) {
      throw new Error('invalid-username-length')
    }
    if (!req.body.password || !req.body.password.length) {
      throw new Error('invalid-password')
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
        usernameHash
      }
    })
    if (!accountInfo) {
      throw new Error('invalid-username')
    }
    const validPassword = await dashboard.Hash.bcryptHashCompare(req.body.password, accountInfo.dataValues.passwordHash, dashboardEncryptionKey)
    if (!validPassword) {
      throw new Error('invalid-password')
    }
    const query = req.query
    req.query = {
      accountid: accountInfo.dataValues.accountid
    }
    const account = await global.api.administrator.Account.get(req)
    if (!account) {
      throw new Error('invalid-account')
    }
    if (!account.deletedAt) {
      throw new Error('invalid-account')
    }
    if (new Date(account.deletedAt).getTime() < new Date().getTime()) {
      throw new Error('invalid-account')
    }
    await dashboard.Storage.Account.update({
      deletedAt: null
    }, {
      where: {
        accountid: accountInfo.dataValues.accountid
      }
    })
    req.account = account
    req.query = {
      accountid: account.accountid
    }
    await dashboard.StorageCache.remove(account.accountid)
    const accountNow = await global.api.user.Account.get(req)
    req.query = query
    return accountNow
  }
}
