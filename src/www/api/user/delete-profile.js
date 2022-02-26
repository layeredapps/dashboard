const dashboard = require('../../../../index.js')
const sequelize = require('sequelize')

module.exports = {
  delete: async (req) => {
    if (!req.query || !req.query.profileid) {
      throw new Error('invalid-profileid')
    }
    if (req.query.profileid === req.account.profileid) {
      throw new Error('invalid-profile')
    }
    const profile = await global.api.user.Profile.get(req)
    if (!profile) {
      throw new Error('invalid-profileid')
    }
    await dashboard.Storage.Profile.destroy({
      where: {
        profileid: req.query.profileid
      }
    })
    await dashboard.Storage.Account.update({
      profileLastDeleted: sequelize.literal('CURRENT_TIMESTAMP')
    }, {
      where: {
        accountid: profile.accountid
      }
    })
    await dashboard.StorageCache.remove(profile.accountid)
    await dashboard.StorageCache.remove(profile.profileid)
    return true
  }
}
