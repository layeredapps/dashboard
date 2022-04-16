const dashboard = require('../../../index.js')

module.exports = {
  before: beforeRequest,
  get: renderPage
}

async function beforeRequest (req) {
  req.query = req.query || {}
  // accounts created
  req.query.keys = dashboard.Metrics.metricKeys('accounts-created').join(',')
  const accounts = await global.api.administrator.MetricKeys.get(req)
  const accountsMaximum = dashboard.Metrics.maximumDay(accounts)
  const accountsChartDays = dashboard.Metrics.days(accounts, accountsMaximum)
  const accountsChartHighlights = dashboard.Metrics.highlights(accounts, accountsChartDays)
  const accountsChartValues = dashboard.Metrics.chartValues(accountsMaximum)
  // active sessions
  req.query.keys = dashboard.Metrics.metricKeys('active-sessions').join(',')
  const sessions = await global.api.administrator.MetricKeys.get(req)
  const sessionsMaximum = dashboard.Metrics.maximumDay(sessions)
  const sessionsChartDays = dashboard.Metrics.days(sessions, sessionsMaximum)
  const sessionsChartHighlights = dashboard.Metrics.highlights(sessions, sessionsChartDays)
  const sessionsChartValues = dashboard.Metrics.chartValues(sessionsMaximum)
  // reset code usage
  req.query.keys = dashboard.Metrics.metricKeys('resetcodes-used').join(',')
  const resetCodes = await global.api.administrator.MetricKeys.get(req)
  const resetCodesMaximum = dashboard.Metrics.maximumDay(resetCodes)
  const resetCodesChartDays = dashboard.Metrics.days(resetCodes, resetCodesMaximum)
  const resetCodesChartHighlights = dashboard.Metrics.highlights(resetCodes, resetCodesChartDays)
  const resetCodesChartValues = dashboard.Metrics.chartValues(resetCodesMaximum)
  req.data = { accountsChartDays, accountsChartHighlights, accountsChartValues, sessionsChartDays, sessionsChartHighlights, sessionsChartValues, resetCodesChartDays, resetCodesChartHighlights, resetCodesChartValues }
}

function renderPage (req, res) {
  const doc = dashboard.HTML.parse(req.html || req.route.html)
  dashboard.HTML.renderList(doc, req.data.accountsChartDays, 'chart-column', 'accounts-chart')
  dashboard.HTML.renderList(doc, req.data.accountsChartValues, 'chart-value', 'accounts-values')
  dashboard.HTML.renderTemplate(doc, req.data.accountsChartHighlights, 'metric-highlights', 'accounts-highlights')
  dashboard.HTML.renderList(doc, req.data.sessionsChartDays, 'chart-column', 'sessions-chart')
  dashboard.HTML.renderList(doc, req.data.sessionsChartValues, 'chart-value', 'sessions-values')
  dashboard.HTML.renderTemplate(doc, req.data.sessionsChartHighlights, 'metric-highlights', 'sessions-highlights')
  if (req.data.resetCodesChartDays.length) {
    dashboard.HTML.renderList(doc, req.data.resetCodesChartDays, 'chart-column', 'reset-codes-chart')
    dashboard.HTML.renderList(doc, req.data.resetCodesChartValues, 'chart-value', 'reset-codes-values')
    dashboard.HTML.renderTemplate(doc, req.data.resetCodesChartHighlights, 'metric-highlights', 'reset-codes-highlights')
  } else {
    const resetCodesContainer = doc.getElementById('reset-codes-container')
    resetCodesContainer.parentNode.removeChild(resetCodesContainer)
  }
  return dashboard.Response.end(req, res, doc)
}
