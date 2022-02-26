const dashboard = require('../../../../index.js')

module.exports = {
  get: async (req) => {
    if (!req.query || !req.query.accountid) {
      throw new Error('invalid-accountid')
    }
    const account = await global.api.user.Account.get(req)
    if (!account) {
      throw new Error('invalid-accountid')
    }
    let profileids
    if (req.query.all) {
      profileids = await dashboard.Storage.Profile.findAll({
        where: {
          accountid: req.query.accountid
        },
        attributes: ['profileid'],
        order: [
          ['createdAt', 'DESC']
        ]
      })
    } else {
      const offset = req.query.offset ? parseInt(req.query.offset, 10) : 0
      const limit = req.query.limit ? parseInt(req.query.limit, 10) : global.pageSize
      profileids = await dashboard.Storage.Profile.findAll({
        where: {
          accountid: req.query.accountid
        },
        attributes: ['profileid'],
        offset,
        limit,
        order: [
          ['createdAt', 'DESC']
        ]
      })
    }
    const profiles = []
    for (const profileData of profileids) {
      req.query.profileid = profileData.dataValues.profileid
      const profile = await global.api.user.Profile.get(req)
      profiles.push(profile)
    }
    return profiles
  }
}
