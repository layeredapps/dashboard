const dashboard = require('../../../index.js')

module.exports = {
  before: beforeRequest,
  get: renderPage
}

async function beforeRequest (req) {
  if (!req.query || !req.query.sessionid) {
    throw new Error('invalid-sessionid')
  }
  const session = await global.api.administrator.Session.get(req)
  session.createdAtFormatted = dashboard.Format.date(session.createdAt)
  session.expiresFormatted = dashboard.Format.date(session.expiresAt)
  req.data = { session }
}

async function renderPage (req, res) {
  const doc = dashboard.HTML.parse(req.html || req.route.html, req.data.session, 'session')
  return dashboard.Response.end(req, res, doc)
}
