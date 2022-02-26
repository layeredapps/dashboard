const dashboard = require('../../../../index.js')
const sequelize = require('sequelize')

module.exports = {
  auth: false,
  patch: async (req) => {
    if (!req.body || !req.body['secret-code']) {
      throw new Error('invalid-secret-code')
    }
    if (!req.body.username) {
      throw new Error('invalid-username')
    }
    if (!req.body.username || !req.body.username.length ||
      global.minimumUsernameLength > req.body.username.length) {
      throw new Error('invalid-username')
    }
    if (!req.body['new-password'] || !req.body['new-password'].length) {
      throw new Error('invalid-password')
    }
    if (global.minimumPasswordLength > req.body['new-password'].length) {
      throw new Error('invalid-password-length')
    }
    if (!req.body['secret-code'] || !req.body['secret-code'].length) {
      throw new Error('invalid-secret-code')
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
    const query = req.query
    req.query = {
      accountid: accountInfo.dataValues.accountid
    }
    const account = await global.api.administrator.Account.get(req)
    req.query = query
    if (!account) {
      throw new Error('invalid-username')
    }
    if (account.deletedAt) {
      throw new Error('invalid-account')
    }
    if (new Date(account.deletedAt).getTime() < new Date().getTime()) {
      throw new Error('invalid-account')
    }
    const secretCodeHash = await dashboard.Hash.sha512Hash(req.body['secret-code'], dashboardEncryptionKey)
    const codeInfo = await dashboard.Storage.ResetCode.findOne({
      where: {
        secretCodeHash
      }
    })
    if (!codeInfo) {
      throw new Error('invalid-reset-code')
    }
    const passwordHash = await dashboard.Hash.bcryptHashHash(req.body['new-password'], dashboardEncryptionKey)
    await dashboard.Storage.Account.update({
      passwordHash,
      resetCodeLastUsedAt: sequelize.literal('CURRENT_TIMESTAMP'),
      sessionKey: dashboard.UUID.random(64),
      sessionKeyLastResetAt: sequelize.literal('CURRENT_TIMESTAMP'),
      passwordLastChanged: sequelize.literal('CURRENT_TIMESTAMP'),
      sessionKeyNumber: account.sessionKeyNumber + 1
    }, {
      where: {
        accountid: accountInfo.dataValues.accountid
      }
    })
    await dashboard.StorageCache.remove(codeInfo.dataValues.accountid)
    await dashboard.Storage.ResetCode.destroy({
      where: {
        codeid: codeInfo.dataValues.codeid
      }
    })
    return true
  }
}
