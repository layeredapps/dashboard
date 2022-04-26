const dashboard = require('../../../../index.js')

module.exports = {
  get: async (req) => {
    if (!req.query || !req.query.profileid) {
      throw new Error('invalid-profileid')
    }
    let profile = await dashboard.StorageCache.get(req.query.profileid)
    if (!profile) {
      let profileInfo
      try {
        profileInfo = await dashboard.Storage.Profile.findOne({
          where: {
            profileid: req.query.profileid,
            appid: req.appid || global.appid
          }
        })
      } catch (error) {
      }
      if (!profileInfo) {
        throw new Error('invalid-profileid')
      }
      profile = {}
      for (const field of profileInfo._options.attributes) {
        profile[field] = profileInfo.get(field)
      }
      await dashboard.StorageCache.set(req.query.profileid, profile)
    }
    return profile
  }
}
