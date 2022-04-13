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
      if (account.profileid) {
        req.query.profileid = account.profileid
        const profile = await global.api.administrator.Profile.get(req)
        account.contactEmail = profile.contactEmail
      }
    }
  }
  const offset = req.query ? req.query.offset || 0 : 0
  // account-delete-requests chart
  req.query.keys = dashboard.Metrics.metricKeys('account-delete-requests', 365).join(',')
  const deleteRequestsChart = await global.api.administrator.MetricKeys.get(req)
  const deleteRequestsChartMaximum = dashboard.Metrics.maximumDay(deleteRequestsChart)
  const deleteRequestsChartDays = dashboard.Metrics.days(deleteRequestsChart, deleteRequestsChartMaximum)
  const deleteRequestsChartHighlights = dashboard.Metrics.highlights(deleteRequestsChart, deleteRequestsChartDays)
  const deleteRequestsChartValues = [
    { object: 'object', value: deleteRequestsChartMaximum },
    { object: 'object', value: Math.floor(deleteRequestsChartMaximum * 0.75) },
    { object: 'object', value: Math.floor(deleteRequestsChartMaximum * 0.5) },
    { object: 'object', value: Math.floor(deleteRequestsChartMaximum * 0.25) },
    { object: 'object', value: 0 }
  ]
  // accounts-deleted chart
  req.query.keys = dashboard.Metrics.metricKeys('accounts-deleted', 365).join(',')
  const accountsDeletedChart = await global.api.administrator.MetricKeys.get(req)
  const accountsDeletedChartMaximum = dashboard.Metrics.maximumDay(accountsDeletedChart)
  const accountsDeletedChartDays = dashboard.Metrics.days(accountsDeletedChart, accountsDeletedChartMaximum)
  const accountsDeletedChartHighlights = dashboard.Metrics.highlights(accountsDeletedChart, accountsDeletedChartDays)
  const accountsDeletedChartValues = [
    { object: 'object', value: accountsDeletedChartMaximum },
    { object: 'object', value: Math.floor(accountsDeletedChartMaximum * 0.75) },
    { object: 'object', value: Math.floor(accountsDeletedChartMaximum * 0.5) },
    { object: 'object', value: Math.floor(accountsDeletedChartMaximum * 0.25) },
    { object: 'object', value: 0 }
  ]
  

  req.data = { accounts, total, offset, deleteRequestsChartDays, deleteRequestsChartHighlights, deleteRequestsChartValues, accountsDeletedChartDays, accountsDeletedChartHighlights, accountsDeletedChartValues }
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
    if (req.data.deleteRequestsChartDays.length) {
      dashboard.HTML.renderList(doc, req.data.deleteRequestsChartDays, 'chart-column', 'delete-requests-chart')
      dashboard.HTML.renderList(doc, req.data.deleteRequestsChartValues, 'chart-value', 'delete-requests-values')
      dashboard.HTML.renderTemplate(doc, req.data.deleteRequestsChartHighlights, 'metric-highlights', 'delete-requests-highlights')
    } else {
      const deleteRequestsChartContainer = doc.getElementById('delete-requests-chart-container')
      deleteRequestsChartContainer.parentNode.removeChild(deleteRequestsChartContainer)  
    }
    if (req.data.accountsDeletedChartDays.length) {
      dashboard.HTML.renderList(doc, req.data.accountsDeletedChartDays, 'chart-column', 'accounts-deleted-chart')
      dashboard.HTML.renderList(doc, req.data.accountsDeletedChartValues, 'chart-value', 'accounts-deleted-values')
      dashboard.HTML.renderTemplate(doc, req.data.accountsDeletedChartHighlights, 'metric-highlights', 'accounts-deleted-highlights')
    } else {
      const accountsDeletedChartContainer = doc.getElementById('accounts-deleted-chart-container')
      accountsDeletedChartContainer.parentNode.removeChild(accountsDeletedChartContainer)  
    }
  }
  return dashboard.Response.end(req, res, doc)
}
