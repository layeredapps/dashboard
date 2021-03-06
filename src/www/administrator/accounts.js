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
        account.fullName = profile.fullName
      } else {
        account.contactEmail = '-'
        account.fullName = '-'
      }
    }
  }
  const offset = req.query ? req.query.offset || 0 : 0
  let createdChartDays, createdChartHighlights, createdChartValues
  if (offset === 0) {
    // accounts created
    req.query.keys = dashboard.Metrics.metricKeys('accounts-created', 365).join(',')
    const createdChart = await global.api.administrator.MetricKeys.get(req)
    const createdChartMaximum = dashboard.Metrics.maximumDay(createdChart)
    createdChartDays = dashboard.Metrics.days(createdChart, createdChartMaximum)
    createdChartHighlights = dashboard.Metrics.highlights(createdChart, createdChartDays)
    createdChartValues = dashboard.Metrics.chartValues(createdChartMaximum)
  }
  req.data = { accounts, total, offset, createdChartDays, createdChartHighlights, createdChartValues }
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
    if (req.data.createdChartDays) {
      dashboard.HTML.renderList(doc, req.data.createdChartDays, 'chart-column', 'created-chart')
      dashboard.HTML.renderList(doc, req.data.createdChartValues, 'chart-value', 'created-values')
      dashboard.HTML.renderTemplate(doc, req.data.createdChartHighlights, 'metric-highlights', 'created-highlights')
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
