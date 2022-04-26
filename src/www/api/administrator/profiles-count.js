const dashboard = require('../../../../index.js')

module.exports = {
  get: async (req) => {
    req.query = req.query || {}
    const where = {
      appid: req.appid || global.appid
    }
    if (req.query.accountid) {
      where.accountid = req.query.accountid
    }
    return dashboard.Storage.Profile.count({
      where
    })
  }
}
