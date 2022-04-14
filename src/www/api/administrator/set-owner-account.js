const dashboard = require('../../../../index.js')

module.exports = {
  /**
   * Transfer the ownership by PATCHing the session, then
   * completing an authorization and PATCHing again to apply
   * the queued change
   */
  patch: async (req) => {
    if (!req.query || !req.query.accountid) {
      throw new Error('invalid-accountid')
    }
    if (!req.account.ownerSince || req.query.accountid === req.account.accountid) {
      throw new Error('invalid-account')
    }
    const account = await global.api.administrator.Account.get(req)
    if (!account) {
      throw new Error('invalid-accountid')
    }
    if (account.deletedAt) {
      throw new Error('invalid-account')
    }
    await dashboard.Storage.Account.update({
      ownerSince: new Date(),
      administratorSince: account.administratorSince || new Date()
    }, {
      where: {
        accountid: req.query.accountid
      }
    })
    await dashboard.Storage.Account.update({
      ownerSince: null
    }, {
      where: {
        accountid: req.account.accountid
      }
    })
    await dashboard.StorageCache.remove(req.query.accountid)
    await dashboard.StorageCache.remove(req.account.accountid)
    return global.api.administrator.Account.get(req)
  }
}
