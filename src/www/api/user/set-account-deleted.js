const dashboard = require('../../../../index.js')
const sequelize = require('sequelize')

module.exports = {
  patch: async (req) => {
    if (!req.query || !req.query.accountid) {
      throw new Error('invalid-accountid')
    }
    let accountInfo
    try {
      accountInfo = await dashboard.Storage.Account.findOne({
        where: {
          accountid: req.query.accountid
        }
      })
    } catch (error) {
    }
    if (!accountInfo) {
      throw new Error('invalid-accountid')
    }
    if (accountInfo.dataValues.accountid !== req.account.accountid) {
      throw new Error('invalid-account')
    }
    let dashboardEncryptionKey = global.dashboardEncryptionKey
    if (req.server) {
      dashboardEncryptionKey = req.server.dashboardEncryptionKey || dashboardEncryptionKey
    }
    if (!req.body || !req.body.password || !req.body.password.length) {
      throw new Error('invalid-password')
    }
    const validPassword = await dashboard.Hash.bcryptHashCompare(req.body.password, accountInfo.dataValues.passwordHash, dashboardEncryptionKey)
    if (!validPassword) {
      throw new Error('invalid-password')
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
    return global.api.user.Account.get(req)
  }
}
