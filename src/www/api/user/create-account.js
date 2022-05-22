const crypto = require('crypto')
const dashboard = require('../../../../index.js')

module.exports = {
  auth: false,
  post: async (req) => {
    if (!req || !req.body) {
      throw new Error('invalid-username')
    }
    if (!req.body.username || !req.body.username.length) {
      throw new Error('invalid-username')
    }
    if (!req.body.password || !req.body.password.length) {
      throw new Error('invalid-password')
    }
    if (global.minimumUsernameLength > req.body.username.length ||
        global.maximumUsernameLength < req.body.username.length) {
      throw new Error('invalid-username-length')
    }
    if (global.minimumPasswordLength > req.body.password.length ||
        global.maximumPasswordLength < req.body.password.length) {
      throw new Error('invalid-password-length')
    }
    if (global.requireProfile) {
      const profileFields = req.userProfileFields || global.userProfileFields
      for (const field of profileFields) {
        switch (field) {
          case 'full-name':
            if (!req.body['full-name'] || !req.body['full-name'].length) {
              throw new Error('invalid-full-name')
            }
            if (global.minimumProfileFullNameLength > req.body['full-name'].length ||
              global.maximumProfileFullNameLength < req.body['full-name'].length) {
              throw new Error('invalid-full-name-length')
            }
            continue
          case 'contact-email':
            if (!req.body[field] || req.body[field].indexOf('@') < 1 || !dashboard.Validate.emailAddress(req.body[field])) {
              throw new Error(`invalid-${field}`)
            }
            continue
          case 'display-email':
            if (!req.body[field] || req.body[field].indexOf('@') < 1 || !dashboard.Validate.emailAddress(req.body[field])) {
              throw new Error(`invalid-${field}`)
            }
            continue
          case 'display-name':
            if (!req.body[field] || !req.body[field].length) {
              throw new Error(`invalid-${field}`)
            }
            if (global.minimumProfileDisplayNameLength > req.body[field].length ||
              global.maximumProfileDisplayNameLength < req.body[field].length) {
              throw new Error('invalid-display-name-length')
            }
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
            } catch (error) {
              throw new Error(`invalid-${field}`)
            }
            continue
          default:
            if (!req.body || !req.body[field]) {
              throw new Error(`invalid-${field}`)
            }
            continue
        }
      }
    }
    let dashboardEncryptionKey = global.dashboardEncryptionKey
    if (req.server) {
      dashboardEncryptionKey = req.server.dashboardEncryptionKey || dashboardEncryptionKey
    }
    const usernameHash = await dashboard.Hash.sha512Hash(req.body.username, dashboardEncryptionKey)
    const passwordHash = await dashboard.Hash.bcryptHashHash(req.body.password, dashboardEncryptionKey)
    const accountInfo = {
      appid: req.appid || global.appid,
      usernameHash,
      passwordHash,
      sessionKey: crypto.randomBytes(32).toString('hex'),
      sessionKeyNumber: 1
    }
    const otherUsersExist = await dashboard.Storage.Account.findOne({
      where: {
        appid: req.appid || global.appid
      }
    })
    if (!otherUsersExist) {
      accountInfo.administratorSince = new Date()
      accountInfo.ownerSince = new Date()
    }
    let account
    try {
      account = await dashboard.Storage.Account.create(accountInfo)
    } catch (error) {
      if (error.name === 'SequelizeUniqueConstraintError') {
        throw new Error('duplicate-username')
      }
    }
    if (!account) {
      throw new Error('unknown-error')
    }
    req.query = req.query || {}
    req.query.accountid = account.dataValues.accountid
    req.account = req.query
    req.body.default = 'true'
    if (global.requireProfile) {
      await global.api.user.CreateProfile.post(req)
    }
    req.account = await global.api.user.Account.get(req)
    return req.account
  }
}
