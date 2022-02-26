const dashboard = require('../../../../index.js')
const sequelize = require('sequelize')

module.exports = {
  post: async (req) => {
    if (!req.query || !req.query.accountid) {
      throw new Error('invalid-accountid')
    }
    const account = await global.api.user.Account.get(req)
    if (!account) {
      throw new Error('invalid-accountid')
    }
    if (!req.body || !req.body['secret-code']) {
      throw new Error('invalid-secret-code')
    }
    if (global.minimumResetCodeLength > req.body['secret-code'].length ||
      global.maximumResetCodeLength < req.body['secret-code'].length) {
      throw new Error('invalid-secret-code-length')
    }
    let dashboardEncryptionKey = global.dashboardEncryptionKey
    if (req.server) {
      dashboardEncryptionKey = req.server.dashboardEncryptionKey || dashboardEncryptionKey
    }
    const secretCodeHash = await dashboard.Hash.sha512Hash(req.body['secret-code'], dashboardEncryptionKey)
    const resetCodeInfo = {
      accountid: req.query.accountid,
      secretCodeHash
    }
    const resetCode = await dashboard.Storage.ResetCode.create(resetCodeInfo)
    await dashboard.Storage.Account.update({
      resetCodeLastCreatedAt: sequelize.literal('CURRENT_TIMESTAMP')
    }, {
      where: {
        accountid: req.query.accountid
      }
    })
    req.query.codeid = resetCode.codeid
    const code = await global.api.user.ResetCode.get(req)
    return code
  }
}
