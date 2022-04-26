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
        codeid: req.query.codeid,
        appid: req.appid || global.appid
      }
    })
    await dashboard.Storage.Account.update({
      resetCodeLastDeleted: new Date()
    }, {
      where: {
        accountid: code.accountid,
        appid: req.appid || global.appid
      }
    })
    await dashboard.StorageCache.remove(req.query.codeid)
    return true
  }
}
