const dashboard = require('../../../../index.js')

module.exports = {
  get: async (req) => {
    let where
    if (req.query && req.query.accountid) {
      where = {
        accountid: req.query.accountid
      }
    }
    return dashboard.Storage.Session.count({ where })
  }
}
