const dashboard = require('../../../../index.js')

module.exports = {
  get: async (req) => {
    const where = {
      appid: req.appid || global.appid
    }
    if (req.query && req.query.accountid) {
      where.accountid = req.query.accountid
    }
    return dashboard.Storage.Session.count({ where })
  }
}
