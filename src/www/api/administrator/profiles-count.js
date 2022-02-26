const dashboard = require('../../../../index.js')

module.exports = {
  get: async (req) => {
    req.query = req.query || {}
    let where
    if (req.query.accountid) {
      where = {
        accountid: req.query.accountid
      }
    }
    return dashboard.Storage.Profile.count(where)
  }
}
