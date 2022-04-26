const dashboard = require('../../../../index.js')
const { Op } = require('sequelize')

module.exports = {
  get: async (req) => {
    req.query = req.query || {}
    let accountids
    if (req.query.all) {
      accountids = await dashboard.Storage.Account.findAll({
        attributes: ['accountid'],
        where: {
          deletedAt: {
            [Op.gt]: 0
          },
          appid: req.appid || global.appid
        },
        order: [
          ['createdAt', 'DESC']
        ]
      })
    } else {
      const offset = req.query.offset ? parseInt(req.query.offset, 10) : 0
      const limit = req.query.limit ? parseInt(req.query.limit, 10) : global.pageSize
      accountids = await dashboard.Storage.Account.findAll({
        attributes: ['accountid'],
        where: {
          deletedAt: {
            [Op.gt]: 0
          },
          appid: req.appid || global.appid
        },
        order: [
          ['createdAt', 'DESC']
        ],
        offset,
        limit
      })
    }
    if (!accountids || !accountids.length) {
      return null
    }
    const accounts = []
    for (const accountData of accountids) {
      req.query.accountid = accountData.dataValues.accountid
      const account = await global.api.administrator.Account.get(req)
      accounts.push(account)
    }
    return accounts
  }
}
