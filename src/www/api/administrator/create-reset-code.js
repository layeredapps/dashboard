const dashboard = require('../../../../index.js')
const Validate = require('../../../validate.js')

module.exports = {
  post: async (req) => {
    if (!req.query || !req.query.accountid) {
      throw new Error('invalid-accountid')
    }
    const account = await global.api.administrator.Account.get(req)
    if (!account) {
      throw new Error('invalid-account')
    }
    if (!req.body || !req.body['secret-code'] || !req.body['secret-code'].length) {
      throw new Error('invalid-secret-code')
    }
    if (req.body['secret-code'].match(/^[a-z0-9]+$/i) === null) {
      throw new Error('invalid-secret-code')
    }
    Validate.requestBodyXSS(req.body)
    if (global.minimumResetCodeLength > req.body['secret-code'].length ||
      global.maximumResetCodeLength < req.body['secret-code'].length) {
      throw new Error('invalid-secret-code-length')
    }
    let dashboardEncryptionKey = global.dashboardEncryptionKey
    if (req.server) {
      dashboardEncryptionKey = req.server.dashboardEncryptionKey || dashboardEncryptionKey
    }
    const secretCodeHash = await dashboard.Hash.sha512Hash(req.body['secret-code'], dashboardEncryptionKey)
    const resetCode = await dashboard.Storage.ResetCode.create({
      accountid: req.query.accountid,
      appid: req.appid || global.appid,
      secretCodeHash
    })
    await dashboard.Storage.Account.update({
      resetCodeLastCreatedAt: new Date()
    }, {
      where: {
        accountid: req.account.accountid,
        appid: req.appid || global.appid
      }
    })
    req.query.codeid = resetCode.dataValues.codeid
    return global.api.administrator.ResetCode.get(req)
  }
}
