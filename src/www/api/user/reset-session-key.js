const crypto = require('crypto')
const dashboard = require('../../../../index.js')

module.exports = {
  patch: async (req) => {
    if (!req.query || !req.query.accountid) {
      throw new Error('invalid-accountid')
    }
    const account = await global.api.user.Account.get(req)
    if (!account) {
      throw new Error('invalid-accountid')
    }
    await dashboard.Storage.Account.update({
      sessionKey: crypto.randomBytes(32).toString('hex'),
      sessionKeyLastResetAt: new Date(),
      sessionKeyNumber: account.sessionKeyNumber++
    }, {
      where: {
        accountid: req.query.accountid,
        appid: req.appid || global.appid
      }
    })
    await dashboard.StorageCache.remove(req.query.accountid)
    return true
  }
}
