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
    let profileids
    if (req.query.all) {
      profileids = await dashboard.Storage.Profile.findAll({
        where,
        attributes: ['profileid'],
        order: [
          ['createdAt', 'DESC']
        ]
      })
    } else {
      const offset = req.query.offset ? parseInt(req.query.offset, 10) : 0
      const limit = req.query.limit ? parseInt(req.query.limit, 10) : global.pageSize
      profileids = await dashboard.Storage.Profile.findAll({
        where,
        attributes: ['profileid'],
        offset,
        limit,
        order: [
          ['createdAt', 'DESC']
        ]
      })
    }
    if (!profileids || !profileids.length) {
      return null
    }
    const profiles = []
    for (const profileData of profileids) {
      req.query.profileid = profileData.dataValues.profileid
      const profile = await global.api.administrator.Profile.get(req)
      profiles.push(profile)
    }
    return profiles
  }
}
