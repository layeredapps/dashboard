const dashboard = require('../../../index.js')
const navbar = require('./navbar-account.js')

module.exports = {
  before: beforeRequest,
  get: renderPage
}

async function beforeRequest (req) {
  if (!req.query || !req.query.accountid) {
    req.error = 'invalid-accountid'
    req.removeContents = true
    req.data = {
      account: {
        accountid: ''
      }
    }
    return
  }
  let account
  try {
    account = await global.api.administrator.Account.get(req)
  } catch (error) {
    req.removeContents = true
    req.data = {
      account: {
        accountid: req.query.accountid
      }
    }
    if (error.message === 'invalid-accountid') {
      req.error = error.message
    } else {
      req.error = 'unknown-error'
    }
    return
  }
  const total = await global.api.administrator.ProfilesCount.get(req)
  const profiles = await global.api.administrator.Profiles.get(req)
  if (profiles && profiles.length) {
    for (const profile of profiles) {
      profile.createdAtFormatted = dashboard.Format.date(profile.createdAt)
      if (profile.profileid === account.profileid) {
        account.contactEmail = profile.contactEmail
      }
    }
  }
  const offset = req.query ? req.query.offset || 0 : 0
  req.data = { profiles, account, total, offset }
}

async function renderPage (req, res, messageTemplate) {
  messageTemplate = req.error || messageTemplate || (req.query ? req.query.message : null)
  const doc = dashboard.HTML.parse(req.html || req.route.html, req.data.account, 'account')
  await navbar.setup(doc, req.data.account)
  const removeElements = []
  if (messageTemplate) {
    dashboard.HTML.renderTemplate(doc, null, messageTemplate, 'message-container')
    if (req.removeContents) {
      removeElements.push('no-profiles', 'profiles-table')
    }
  } else {
    if (req.data.profiles && req.data.profiles.length) {
      dashboard.HTML.renderTable(doc, req.data.profiles, 'profile-row', 'profiles-table')
      const retainedFields = req.userProfileFields || global.userProfileFields
      for (const profile of req.data.profiles) {
        for (const field of global.profileFields) {
          if (retainedFields.indexOf(field) > -1) {
            continue
          }
          if (field === 'full-name') {
            if (retainedFields.indexOf('first-name') === -1) {
              removeElements.push(`first-name-${profile.profileid}`)
            }
            if (retainedFields.indexOf('last-name') === -1) {
              removeElements.push(`last-name-${profile.profileid}`)
            }
            continue
          }
          removeElements.push(`${field}-${profile.profileid}`)
        }
      }
      if (req.data.total <= global.pageSize) {
        removeElements.push('page-links')
      } else {
        dashboard.HTML.renderPagination(doc, req.data.offset, req.data.total)
      }
      removeElements.push('no-profiles')
    } else {
      removeElements.push('profiles-table')
    }
  }
  for (const id of removeElements) {
    const element = doc.getElementById(id)
    element.parentNode.removeChild(element)
  }
  return dashboard.Response.end(req, res, doc)
}
