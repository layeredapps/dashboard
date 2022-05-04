const dashboard = require('../../../index.js')
const navbar = require('./navbar-session.js')

module.exports = {
  before: beforeRequest,
  get: renderPage
}

async function beforeRequest (req) {
  if (!req.query || !req.query.sessionid) {
    req.error = 'invalid-sessionid'
    req.removeContents = true
    return
  }
  let session
  try {
    session = await global.api.user.Session.get(req)
  } catch (error) {
    session = {
      sessionid: req.query.sessionid
    }
    req.removeContents = true
    if (error.message === 'invalid-account' || error.message === 'invalid-sessionid') {
      req.error = error.message
    } else {
      req.error = 'unknown-error'
    }
  }
  if (session.createdAt) {
    session.createdAtFormatted = dashboard.Format.date(session.createdAt)
  }
  if (session.expiresAt) {
    session.expiresFormatted = dashboard.Format.date(session.expiresAt)
  }
  if (session.endedAt) {
    session.endedAtFormatted = dashboard.Format.date(session.endedAt)
  }
  req.data = { session }
}

async function renderPage (req, res, messageTemplate) {
  messageTemplate = req.error || messageTemplate || (req.query ? req.query.message : null)
  const doc = dashboard.HTML.parse(req.html || req.route.html, req.data.session, 'session')
  await navbar.setup(doc, req.data.session)
  const removeElements = []
  if (messageTemplate) {
    dashboard.HTML.renderTemplate(doc, null, messageTemplate, 'message-container')
    if (req.removeContents) {
      removeElements.push('sessions-table')
    }
  }
  if (req.data.session.endedAt) {
    removeElements.push('expires')
  } else {
    removeElements.push('ended')
  }
  for (const id of removeElements) {
    const element = doc.getElementById(id)
    element.parentNode.removeChild(element)
  }
  return dashboard.Response.end(req, res, doc)
}
