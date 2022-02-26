const dashboard = require('../../../../index.js')
const sequelize = require('sequelize')

module.exports = {
  delete: async (req) => {
    if (!req.query || !req.query.codeid) {
      throw new Error('invalid-reset-codeid')
    }
    const code = await global.api.user.ResetCode.get(req)
    if (code.accountid !== req.account.accountid) {
      throw new Error('invalid-account')
    }
    await dashboard.Storage.ResetCode.destroy({
      where: {
        codeid: req.query.codeid
      }
    })
    await dashboard.Storage.Account.update({
      resetCodeLastDeleted: sequelize.literal('CURRENT_TIMESTAMP')
    }, {
      where: {
        accountid: code.accountid
      }
    })
    await dashboard.StorageCache.remove(req.query.codeid)
    return true
  }
}
