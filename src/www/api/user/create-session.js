const crypto = require('crypto')
const dashboard = require('../../../../index.js')

module.exports = {
  auth: false,
  post: async (req) => {
    if (!req || !req.body) {
      throw new Error('invalid-username')
    }
    if (!req.body.username || !req.body.username.length) {
      throw new Error('invalid-username')
    }
    if (!req.body.password || !req.body.password.length) {
      throw new Error('invalid-password')
    }
    let dashboardEncryptionKey = global.dashboardEncryptionKey
    let dashboardSessionKey = global.dashboardSessionKey
    if (req.server) {
      dashboardEncryptionKey = req.server.dashboardEncryptionKey || dashboardEncryptionKey
      dashboardSessionKey = req.server.dashboardSessionKey || dashboardSessionKey
    }
    const usernameHash = await dashboard.Hash.sha512Hash(req.body.username, dashboardEncryptionKey)
    const accountData = await dashboard.Storage.Account.findOne({
      where: {
        usernameHash,
        appid: req.appid || global.appid
      }
    })
    const account = accountData ? accountData.dataValues : undefined
    if (!account) {
      if (global.minimumUsernameLength > req.body.username.length ||
          global.maximumUsernameLength < req.body.username.length) {
        throw new Error('invalid-username-length')
      }
      if (global.minimumPasswordLength > req.body.password.length ||
          global.maximumUsernameLength < req.body.password.length) {
        throw new Error('invalid-password-length')
      }
      throw new Error('invalid-username')
    }
    const validPassword = await dashboard.Hash.bcryptHashCompare(req.body.password, account.passwordHash, dashboardEncryptionKey)
    if (!validPassword) {
      throw new Error('invalid-password')
    }
    let duration
    switch (req.body.remember) {
      case 'hours':
        duration = 8 * 60 * 60
        break
      case 'days':
        duration = 30 * 24 * 60 * 60
        break
      default:
        duration = 20 * 60
        break
    }
    const sessionToken = crypto.randomBytes(32).toString('hex')
    const tokenHash = await dashboard.Hash.sha512Hash(`${account.accountid}/${sessionToken}/${account.sessionKey}/${dashboardSessionKey}`, dashboardEncryptionKey)
    const sessionInfo = {
      accountid: account.accountid,
      appid: req.appid || global.appid,
      tokenHash,
      sessionKeyNumber: account.sessionKeyNumber,
      duration
    }
    const session = await dashboard.Storage.Session.create(sessionInfo)
    await dashboard.Storage.Account.update({
      lastSignedInAt: session.createdAt
    }, {
      where: {
        accountid: account.accountid,
        appid: req.appid || global.appid
      }
    })
    await dashboard.StorageCache.remove(account.accountid)
    req.query = req.query || {}
    req.query.sessionid = session.dataValues.sessionid
    req.account = account
    req.session = await global.api.user.Session.get(req)
    req.session.token = sessionToken
    return req.session
  }
}
