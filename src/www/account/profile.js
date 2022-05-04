const dashboard = require('../../../index.js')
const navbar = require('./navbar-profile.js')

module.exports = {
  before: beforeRequest,
  get: renderPage
}

async function beforeRequest (req) {
  if (!req.query || !req.query.profileid) {
    req.error = 'invalid-profileid'
    req.removeContents = true
    return
  }
  let profile
  try {
    profile = await global.api.user.Profile.get(req)
  } catch (error) {
    profile = {
      profileid: req.query.profileid
    }
    req.removeContents = true
    if (error.message === 'invalid-profileid' || error.message === 'invalid-account') {
      req.error = error.message
    } else {
      req.error = 'unknown-error'
    }
  }
  if (profile.createdAt) {
    profile.createdAtFormatted = dashboard.Format.date(profile.createdAt)
  }
  req.data = { profile }
}

async function renderPage (req, res, messageTemplate) {
  messageTemplate = req.error || messageTemplate || (req.query ? req.query.message : null)
  const doc = dashboard.HTML.parse(req.html || req.route.html, req.data.profile, 'profile')
  await navbar.setup(doc, req.data.profile)
  const removeElements = []
  if (messageTemplate) {
    dashboard.HTML.renderTemplate(doc, null, messageTemplate, 'message-container')
    if (req.removeContents) {
      removeElements.push('profiles-table')
    }
  }
  if (req.account.profileid === req.query.profileid) {
    removeElements.push('is-not-default')
  } else {
    removeElements.push('is-default')
  }
  const retainedFields = req.userProfileFields || global.userProfileFields
  for (const field of global.profileFields) {
    if (retainedFields.indexOf(field) > -1) {
      continue
    }
    if (field === 'full-name') {
      if (retainedFields.indexOf('first-name') === -1) {
        removeElements.push('first-name')
      }
      if (retainedFields.indexOf('last-name') === -1) {
        removeElements.push('last-name')
      }
      continue
    }
    removeElements.push(field)
  }
  for (const id of removeElements) {
    const element = doc.getElementById(id)
    element.parentNode.removeChild(element)
  }
  return dashboard.Response.end(req, res, doc)
}
