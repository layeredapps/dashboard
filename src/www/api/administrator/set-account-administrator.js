const dashboard = require('../../../../index.js')
const sequelize = require('sequelize')

module.exports = {
  /**
   * Create an administratorSince by POSTing the accountid, then
   * completing an authorization and POSTing again to apply
   * the queued change
   */
  patch: async (req) => {
    if (!req.query || !req.query.accountid) {
      throw new Error('invalid-accountid')
    }
    const account = await global.api.administrator.Account.get(req)
    if (!account) {
      throw new Error('invalid-accountid')
    }
    if (account.deleted || account.administratorSince) {
      throw new Error('invalid-account')
    }
    await dashboard.Storage.Account.update({
      administratorSince: sequelize.literal('CURRENT_TIMESTAMP')
    }, {
      where: {
        accountid: req.query.accountid
      }
    })
    await dashboard.StorageCache.remove(req.query.accountid)
    return global.api.administrator.Account.get(req)
  }
}
