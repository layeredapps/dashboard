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
  account.createdAtFormatted = dashboard.Format.date(account.createdAt)
  account.lastSignedInAtFormatted = dashboard.Format.date(account.lastSignedInAt)
  req.query.profileid = account.profileid
  const profiles = await global.api.administrator.Profiles.get(req)
  if (profiles && profiles.length) {
    for (const profile of profiles) {
      profile.createdAtFormatted = dashboard.Format.date(profile.createdAt)
    }
  }
  const sessions = await global.api.administrator.Sessions.get(req)
  if (sessions && sessions.length) {
    for (const session of sessions) {
      session.createdAtFormatted = dashboard.Format.date(session.createdAt)
      session.expiresFormatted = dashboard.Format.date(session.expiresAt)
    }
  }
  const resetCodes = await global.api.administrator.ResetCodes.get(req)
  if (resetCodes && resetCodes.length) {
    for (const resetCode of resetCodes) {
      resetCode.createdAtFormatted = dashboard.Format.date(resetCode.createdAt)
    }
  }
  req.data = { account, profiles, sessions, resetCodes }
}

async function renderPage (req, res, messageTemplate) {
  messageTemplate = req.error || messageTemplate || (req.query ? req.query.message : null)
  const doc = dashboard.HTML.parse(req.html || req.route.html, req.data.account, 'account')
  await navbar.setup(doc, req.data.account)
  const removeElements = []
  if (messageTemplate) {
    dashboard.HTML.renderTemplate(doc, null, messageTemplate, 'message-container')
    if (req.removeContents) {
      removeElements.push('table-container')
    }
  } else {
    if (req.data.sessions && req.data.sessions.length) {
      dashboard.HTML.renderTable(doc, req.data.sessions, 'session-row', 'sessions-table')
    } else {
      removeElements.push('sessions-table')
    }
    if (req.data.resetCodes && req.data.resetCodes.length) {
      dashboard.HTML.renderTable(doc, req.data.resetCodes, 'reset-code-row', 'reset-codes-table')
    } else {
      removeElements.push('reset-codes-container')
    }
    if (req.data.profiles && req.data.profiles.length) {
      dashboard.HTML.renderTable(doc, req.data.profiles, 'profile-row', 'profiles-table')
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
