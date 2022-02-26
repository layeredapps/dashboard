const dashboard = require('../../../../index.js')
const { Op } = require('sequelize')

module.exports = {
  get: async (req) => {
    return dashboard.Storage.Account.count({
      where: {
        administratorSince: {
          [Op.gt]: 0
        }
      }
    })
  }
}
