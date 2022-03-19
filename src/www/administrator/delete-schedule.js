const dashboard = require('../../../index.js')

module.exports = {
  before: beforeRequest,
  get: renderPage
}

async function beforeRequest (req) {
  const total = await global.api.administrator.DeletedAccountsCount.get(req)
  const accounts = await global.api.administrator.DeletedAccounts.get(req)
  if (accounts && accounts.length) {
    req.query = req.query || {}
    for (const account of accounts) {
      account.createdAtFormatted = dashboard.Format.date(account.createdAt)
      account.lastSignedInAtFormatted = dashboard.Format.date(account.lastSignedInAt)
      account.deletedAtFormatted = dashboard.Format.date(account.deletedAt)
      req.query.profileid = account.profileid
      const profile = await global.api.administrator.Profile.get(req)
      account.contactEmail = profile.contactEmail
    }
  }
  const offset = req.query ? req.query.offset || 0 : 0
  req.data = { accounts, total, offset }
}

async function renderPage (req, res) {
  const doc = dashboard.HTML.parse(req.html || req.route.html)
  if (req.data.accounts && req.data.accounts.length) {
    dashboard.HTML.renderTable(doc, req.data.accounts, 'account-row', 'accounts-table')
    if (req.data.total <= global.pageSize) {
      const pageLinks = doc.getElementById('page-links')
      pageLinks.parentNode.removeChild(pageLinks)
    } else {
      dashboard.HTML.renderPagination(doc, req.data.offset, req.data.total)
    }
  }
  return dashboard.Response.end(req, res, doc)
}
