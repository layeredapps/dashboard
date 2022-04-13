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
  const accountsDays = dashboard.Metrics.days(accounts, accountsMaximum)
  const accountsHighlights = dashboard.Metrics.highlights(accounts, accountsDays)
  const accountsValues = [
    { object: 'object', value: accountsMaximum },
    { object: 'object', value: Math.floor(accountsMaximum * 0.75) },
    { object: 'object', value: Math.floor(accountsMaximum * 0.5) },
    { object: 'object', value: Math.floor(accountsMaximum * 0.25) },
    { object: 'object', value: 0 }
  ]
  // active sessions
  req.query.keys = dashboard.Metrics.metricKeys('active-sessions').join(',')
  const sessions = await global.api.administrator.MetricKeys.get(req)
  const sessionsMaximum = dashboard.Metrics.maximumDay(sessions)
  const sessionsDays = dashboard.Metrics.days(sessions, sessionsMaximum)
  const sessionsHighlights = dashboard.Metrics.highlights(sessions, sessionsDays)
  const sessionsValues = [
    { object: 'object', value: sessionsMaximum },
    { object: 'object', value: Math.floor(sessionsMaximum * 0.75) },
    { object: 'object', value: Math.floor(sessionsMaximum * 0.5) },
    { object: 'object', value: Math.floor(sessionsMaximum * 0.25) },
    { object: 'object', value: 0 }
  ]
  // reset code usage
  req.query.keys = dashboard.Metrics.metricKeys('resetcodes-used').join(',')
  const resetCodes = await global.api.administrator.MetricKeys.get(req)
  const resetCodesMaximum = dashboard.Metrics.maximumDay(resetCodes)
  const resetCodesDays = dashboard.Metrics.days(resetCodes, resetCodesMaximum)
  const resetCodesHighlights = dashboard.Metrics.highlights(resetCodes, resetCodesDays)
  const resetCodesValues = [
    { object: 'object', value: resetCodesMaximum },
    { object: 'object', value: Math.floor(resetCodesMaximum * 0.75) },
    { object: 'object', value: Math.floor(resetCodesMaximum * 0.5) },
    { object: 'object', value: Math.floor(resetCodesMaximum * 0.25) },
    { object: 'object', value: 0 }
  ]
  req.data = { accountsDays, accountsHighlights, accountsValues, sessionsDays, sessionsHighlights, sessionsValues, resetCodesDays, resetCodesHighlights, resetCodesValues }
}

function renderPage (req, res) {
  const doc = dashboard.HTML.parse(req.html || req.route.html)
  dashboard.HTML.renderList(doc, req.data.accountsDays, 'chart-column', 'accounts-chart')
  dashboard.HTML.renderList(doc, req.data.accountsValues, 'chart-value', 'accounts-values')
  dashboard.HTML.renderTemplate(doc, req.data.accountsHighlights, 'metric-highlights', 'accounts-highlights')
  dashboard.HTML.renderList(doc, req.data.sessionsDays, 'chart-column', 'sessions-chart')
  dashboard.HTML.renderList(doc, req.data.sessionsValues, 'chart-value', 'sessions-values')
  dashboard.HTML.renderTemplate(doc, req.data.sessionsHighlights, 'metric-highlights', 'sessions-highlights')
  if (req.data.resetCodesDays.length) {
    dashboard.HTML.renderList(doc, req.data.resetCodesDays, 'chart-column', 'reset-codes-chart')
    dashboard.HTML.renderList(doc, req.data.resetCodesValues, 'chart-value', 'reset-codes-values')
    dashboard.HTML.renderTemplate(doc, req.data.resetCodesHighlights, 'metric-highlights', 'reset-codes-highlights')
  } else {
    const resetCodesContainer = doc.getElementById('reset-codes-container')
    resetCodesContainer.parentNode.removeChild(resetCodesContainer)
  }
  return dashboard.Response.end(req, res, doc)
}
