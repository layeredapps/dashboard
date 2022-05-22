const dashboard = require('../../../index.js')

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
    profile = await global.api.administrator.Profile.get(req)
  } catch (error) {
    profile = {
      profileid: req.query.profileid
    }
    req.removeContents = true
    if (error.message === 'invalid-profileid') {
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
  const removeElements = []
  if (messageTemplate) {
    dashboard.HTML.renderTemplate(doc, null, messageTemplate, 'message-container')
    if (req.removeContents) {
      removeElements.push('submit-form')
    }
  } else {
    const retainedFields = req.userProfileFields || global.userProfileFields
    for (const field of global.profileFields) {
      if (retainedFields.indexOf(field) > -1) {
        continue
      }
      removeElements.push(field)
    }
  }
  for (const id of removeElements) {
    const element = doc.getElementById(id)
    element.parentNode.removeChild(element)
  }
  return dashboard.Response.end(req, res, doc)
}
