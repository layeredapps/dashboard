const dashboard = require('../../../../index.js')

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
      secretCodeHash
    })
    await dashboard.Storage.Account.update({
      resetCodeLastCreatedAt: new Date()
    }, {
      where: {
        accountid: req.account.accountid
      }
    })
    req.query.codeid = resetCode.dataValues.codeid
    return global.api.administrator.ResetCode.get(req)
  }
}
