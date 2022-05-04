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
        accountid: req.query.accountid
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
  const total = await global.api.administrator.SessionsCount.get(req)
  const sessions = await global.api.administrator.Sessions.get(req)
  if (sessions && sessions.length) {
    for (const session of sessions) {
      session.createdAtFormatted = dashboard.Format.date(session.createdAt)
      session.expiresFormatted = dashboard.Format.date(session.expiresAt)
    }
  }
  if (account.profileid) {
    req.query.profileid = account.profileid
    const profile = await global.api.administrator.Profile.get(req)
    account.contactEmail = profile.contactEmail
    account.firstName = profile.firstName
    account.lastName = profile.lastName
  }
  const offset = req.query ? req.query.offset || 0 : 0
  req.data = { sessions, account, total, offset }
}

async function renderPage (req, res, messageTemplate) {
  messageTemplate = req.error || messageTemplate || (req.query ? req.query.message : null)
  const doc = dashboard.HTML.parse(req.html || req.route.html, req.data.account, 'account')
  await navbar.setup(doc, req.data.account)
  const removeElements = []
  if (messageTemplate) {
    dashboard.HTML.renderTemplate(doc, null, messageTemplate, 'message-container')
    if (req.removeContents) {
      removeElements.push('no-reset-codes', 'reset-codes-table')
    }
  } else {
    if (req.data.sessions && req.data.sessions.length) {
      dashboard.HTML.renderTable(doc, req.data.sessions, 'session-row', 'sessions-table')
      if (req.data.total <= global.pageSize) {
        removeElements.push('page-links')
      } else {
        dashboard.HTML.renderPagination(doc, req.data.offset, req.data.total)
      }
      removeElements.push('no-sessions')
    } else {
      removeElements.push('sessions-table')
    }
  }
  for (const id of removeElements) {
    const element = doc.getElementById(id)
    element.parentNode.removeChild(element)
  }
  return dashboard.Response.end(req, res, doc)
}
