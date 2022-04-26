const dashboard = require('../../../../index.js')

module.exports = {
  get: async (req) => {
    if (!req.query || !req.query.accountid) {
      throw new Error('invalid-accountid')
    }
    let account = await dashboard.StorageCache.get(req.query.accountid)
    if (!account) {
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
      account = {}
      for (const field of accountInfo._options.attributes) {
        account[field] = accountInfo.get(field)
      }
      await dashboard.StorageCache.set(req.query.accountid, account)
    }
    delete (account.sessionKey)
    delete (account.usernameHash)
    delete (account.passwordHash)
    return account
  }
}
