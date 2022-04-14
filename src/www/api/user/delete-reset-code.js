const dashboard = require('../../../../index.js')

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
      resetCodeLastDeleted: new Date()
    }, {
      where: {
        accountid: code.accountid
      }
    })
    await dashboard.StorageCache.remove(req.query.codeid)
    return true
  }
}
