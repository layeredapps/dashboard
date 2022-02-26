const dashboard = require('../../../../index.js')
const sequelize = require('sequelize')

module.exports = {
  get: async (req) => {
    return dashboard.Storage.Account.count({
      where: {
        deletedAt: {
          [sequelize.Op.gt]: 0
        }
      }
    })
  }
}
