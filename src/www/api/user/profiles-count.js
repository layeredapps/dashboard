const dashboard = require('../../../../index.js')

module.exports = {
  get: async (req) => {
    if (!req.query || !req.query.accountid) {
      throw new Error('invalid-accountid')
    }
    const account = await global.api.user.Account.get(req)
    if (!account) {
      throw new Error('invalid-accountid')
    }
    return dashboard.Storage.Profile.count({
      where: {
        accountid: req.query.accountid,
        appid: req.appid || global.appid
      }
    })
  }
}
