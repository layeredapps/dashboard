const dashboard = require('../../../../index.js')

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
        profileid: req.query.profileid,
        appid: req.appid || global.appid
      }
    })
    await dashboard.Storage.Account.update({
      profileLastDeleted: new Date()
    }, {
      where: {
        accountid: profile.accountid,
        appid: req.appid || global.appid
      }
    })
    await dashboard.StorageCache.remove(profile.accountid)
    await dashboard.StorageCache.remove(profile.profileid)
    return true
  }
}
