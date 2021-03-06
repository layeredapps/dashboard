const dashboard = require('../../../../index.js')

module.exports = {
  post: async (req) => {
    if (!req.query || !req.query.accountid) {
      throw new Error('invalid-accountid')
    }
    const account = await global.api.user.Account.get(req)
    if (!account) {
      throw new Error('invalid-accountid')
    }
    req.body = req.body || {}
    const profileInfo = {
      accountid: req.query.accountid,
      appid: req.appid || global.appid
    }
    const profileFields = req.userProfileFields || global.userProfileFields
    for (const field of profileFields) {
      const displayName = global.profileFieldMap[field]
      switch (field) {
        case 'full-name':
          if (!req.body['full-name'] || !req.body['full-name'].length) {
            throw new Error('invalid-full-name')
          }
          if (global.minimumProfileFullNameLength > req.body['full-name'].length ||
            global.maximumProfileFullNameLength < req.body['full-name'].length) {
            throw new Error('invalid-full-name-length')
          }
          profileInfo.fullName = req.body['full-name']
          continue
        case 'contact-email':
          if (!req.body[field] || req.body[field].indexOf('@') < 1 || !dashboard.Validate.emailAddress(req.body[field])) {
            throw new Error(`invalid-${field}`)
          }
          profileInfo.contactEmail = req.body[field]
          continue
        case 'display-email':
          if (!req.body[field] || req.body[field].indexOf('@') < 1 || !dashboard.Validate.emailAddress(req.body[field])) {
            throw new Error(`invalid-${field}`)
          }
          profileInfo.displayEmail = req.body[field]
          continue
        case 'display-name':
          if (!req.body[field] || !req.body[field].length) {
            throw new Error(`invalid-${field}`)
          }
          if (global.minimumProfileDisplayNameLength > req.body[field].length ||
            global.maximumProfileDisplayNameLength < req.body[field].length) {
            throw new Error('invalid-display-name-length')
          }
          profileInfo.displayName = req.body[field]
          continue
        case 'company-name':
          if (!req.body[field] || !req.body[field].length) {
            throw new Error(`invalid-${field}`)
          }
          if (global.minimumProfileCompanyNameLength > req.body[field].length ||
            global.maximumProfileCompanyNameLength < req.body[field].length) {
            throw new Error('invalid-company-name-length')
          }
          profileInfo.companyName = req.body[field]
          continue
        case 'dob':
          if (!req.body[field] || !req.body[field].length) {
            throw new Error(`invalid-${field}`)
          }
          try {
            const date = dashboard.Format.parseDate(req.body[field])
            if (!date || !date.getFullYear) {
              throw new Error(`invalid-${field}`)
            }
            profileInfo.dob = dashboard.Format.date(date)
          } catch (error) {
            throw new Error(`invalid-${field}`)
          }
          continue
        default:
          if (!req.body || !req.body[field]) {
            throw new Error(`invalid-${field}`)
          }
          profileInfo[displayName] = req.body[field]
          continue
      }
    }
    const profile = await dashboard.Storage.Profile.create(profileInfo)
    if (req.body.default === 'true') {
      await dashboard.Storage.Account.update({
        profileid: profile.dataValues.profileid
      }, {
        where: {
          accountid: req.query.accountid,
          appid: req.appid || global.appid
        }
      })
      await dashboard.StorageCache.remove(profile.dataValues.accountid)
    }
    req.query.profileid = profile.dataValues.profileid
    return global.api.user.Profile.get(req)
  }
}
