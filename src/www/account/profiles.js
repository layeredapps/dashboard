const dashboard = require('../../../index.js')

module.exports = {
  before: beforeRequest,
  get: renderPage
}

async function beforeRequest (req) {
  req.query = req.query || {}
  req.query.accountid = req.account.accountid
  const total = await global.api.user.ProfilesCount.get(req)
  const profiles = await global.api.user.Profiles.get(req)
  if (profiles && profiles.length) {
    for (const profile of profiles) {
      profile.createdAtFormatted = dashboard.Format.date(profile.createdAt)
    }
  }
  const offset = req.query ? parseInt(req.query.offset, 10) || 0 : 0
  req.data = { profiles, total, offset }
}

async function renderPage (req, res) {
  const doc = dashboard.HTML.parse(req.html || req.route.html)
  const removeElements = []
  const retainedFields = req.userProfileFields || global.userProfileFields
  if (req.data.profiles && req.data.profiles.length) {
    for (const profile of req.data.profiles) {
      for (const field of global.profileFields) {
        if (retainedFields.indexOf(field) > -1) {
          continue
        }
        if (field === 'full-name') {
          if (retainedFields.indexOf('first-name') === -1) {
            removeElements.push(`first-name-${profile.profileid}`)
            if (profile === req.data.profiles[0]) {
              removeElements.push('first-name')
            }
          }
          if (retainedFields.indexOf('last-name') === -1) {
            removeElements.push(`last-name-${profile.profileid}`)
            if (profile === req.data.profiles[0]) {
              removeElements.push('last-name')
            }
          }
          continue
        }
        removeElements.push(`${field}-${profile.profileid}`)
        if (profile === req.data.profiles[0]) {
          removeElements.push(field)
        }
      }
      if (req.account.profileid === profile.profileid) {
        removeElements.push(`is-not-default-${profile.profileid}`)
      } else {
        removeElements.push(`is-default-${profile.profileid}`)
      }
    }
    dashboard.HTML.renderTable(doc, req.data.profiles, 'profile-row', 'profiles-table')
    if (req.data.total <= global.pageSize) {
      removeElements.push('page-links')
    } else {
      dashboard.HTML.renderPagination(doc, req.data.offset, req.data.total)
    }
    removeElements.push('no-profiles')
  } else {
    removeElements.push('profiles-table')
  }

  for (const id of removeElements) {
    const element = doc.getElementById(id)
    element.parentNode.removeChild(element)
  }
  return dashboard.Response.end(req, res, doc)
}
