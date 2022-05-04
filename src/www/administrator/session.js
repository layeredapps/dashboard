const dashboard = require('../../../index.js')

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
    session = await global.api.administrator.Session.get(req)
  } catch (error) {
    session = {
      sessionid: req.query.sessionid
    }
    req.removeContents = true
    if (error.message === 'invalid-sessionid') {
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
  const removeElements = []
  if (messageTemplate) {
    dashboard.HTML.renderTemplate(doc, null, messageTemplate, 'message-container')
    if (req.removeContents) {
      removeElements.push('submit-form')
    }
  } else {
    if (req.data.session.endedAt) {
      removeElements.push('expires')
    } else {
      removeElements.push('ended')
    }
  }
  return dashboard.Response.end(req, res, doc)
}
