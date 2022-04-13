const dashboard = require('../../../index.js')

module.exports = {
  before: beforeRequest,
  get: renderPage
}

async function beforeRequest (req) {
  const total = await global.api.administrator.AccountsCount.get(req)
  const accounts = await global.api.administrator.Accounts.get(req)
  if (accounts && accounts.length) {
    req.query = req.query || {}
    for (const account of accounts) {
      account.createdAtFormatted = dashboard.Format.date(account.createdAt)
      account.lastSignedInAtFormatted = account.lastSignedInAt ? dashboard.Format.date(account.lastSignedInAt) : '-'
      if (account.profileid) {
        req.query.profileid = account.profileid
        const profile = await global.api.administrator.Profile.get(req)
        account.contactEmail = profile.contactEmail
        account.firstName = profile.firstName
        account.lastName = profile.lastName
      } else {
        account.contactEmail = '-'
        account.firstName = '-'
        account.lastName = '-'
      }
    }
  }
  const offset = req.query ? req.query.offset || 0 : 0
  let createdDays, createdHighlights, createdValues
  if (offset === 0) {
    // accounts created
    req.query.keys = dashboard.Metrics.metricKeys('accounts-created', 365).join(',')
    const created = await global.api.administrator.MetricKeys.get(req)
    const createdMaximum = dashboard.Metrics.maximumDay(created)
    createdDays = dashboard.Metrics.days(created, createdMaximum)
    createdHighlights = dashboard.Metrics.highlights(created, createdDays)
    createdValues = [
      { object: 'object', value: createdMaximum },
      { object: 'object', value: Math.floor(createdMaximum * 0.75) },
      { object: 'object', value: Math.floor(createdMaximum * 0.5) },
      { object: 'object', value: Math.floor(createdMaximum * 0.25) },
      { object: 'object', value: 0 }
    ]
  }
  req.data = { accounts, total, offset, createdDays, createdHighlights, createdValues }
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
    const noAccounts = doc.getElementById('no-accounts')
    noAccounts.parentNode.removeChild(noAccounts)
    if (req.data.createdDays) {
      dashboard.HTML.renderList(doc, req.data.createdDays, 'chart-column', 'created-chart')
      dashboard.HTML.renderList(doc, req.data.createdValues, 'chart-value', 'created-values')
      dashboard.HTML.renderTemplate(doc, req.data.createdHighlights, 'metric-highlights', 'created-highlights')
    } else {
      const createdChart = doc.getElementById('created-chart-container')
      createdChart.parentNode.removeChild(createdChart)
    }
  } else {
    const accountsTable = doc.getElementById('accounts-table')
    accountsTable.parentNode.removeChild(accountsTable)
  }
  return dashboard.Response.end(req, res, doc)
}
