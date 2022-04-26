const dashboard = require('../../../../index.js')

module.exports = {
  get: async (req) => {
    return dashboard.Storage.Account.count({
      where: {
        appid: req.appid || global.appid
      }
    })
  }
}
