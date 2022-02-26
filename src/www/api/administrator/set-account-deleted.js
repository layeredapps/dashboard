const dashboard = require('../../../../index.js')
const sequelize = require('sequelize')

module.exports = {
  patch: async (req) => {
    if (!req.query || !req.query.accountid) {
      throw new Error('invalid-accountid')
    }
    const account = await global.api.administrator.Account.get(req)
    if (!account) {
      throw new Error('invalid-accountid')
    }
    if (account.deletedAt) {
      throw new Error('invalid-account')
    }
    const updateClause = {}
    if (!process.env.STORAGE || process.env.STORAGE === 'sqlite') {
      updateClause.deletedAt = sequelize.fn('datetime', sequelize.literal('CURRENT_TIMESTAMP'), `+${global.deleteDelay} days`)
    } else if (process.env.STORAGE === 'postgresql') {
      updateClause.deletedAt = sequelize.literal(`NOW() + interval '${global.deleteDelay}d'`)
    } else if (process.env.STORAGE === 'mariadb' || process.env.STORAGE === 'mysql') {
      updateClause.deletedAt = sequelize.literal(`date_add(NOW(), interval ${global.deleteDelay} day)`)
    }
    await dashboard.Storage.Account.update(updateClause, {
      where: {
        accountid: req.query.accountid
      }
    })
    await dashboard.StorageCache.remove(req.query.accountid)
    return global.api.administrator.Account.get(req)
  }
}
