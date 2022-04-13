const dashboard = require('../../../index.js')

module.exports = {
  before: beforeRequest,
  get: renderPage
}

async function beforeRequest (req) {
  req.query = req.query || {}
  // accounts created
  req.query.keys = dashboard.Metrics.metricKeys('accounts-created').join(',')
  const created = await global.api.administrator.MetricKeys.get(req)
  const createdMaximum = dashboard.Metrics.maximumDay(created)
  const createdDays = dashboard.Metrics.days(created, createdMaximum)
  const createdHighlights = dashboard.Metrics.highlights(created, createdDays)
  const createdValues = [
    { object: 'object', value: createdMaximum },
    { object: 'object', value: Math.floor(createdMaximum * 0.75) },
    { object: 'object', value: Math.floor(createdMaximum * 0.5) },
    { object: 'object', value: Math.floor(createdMaximum * 0.25) },
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
  req.data = { createdDays, createdHighlights, createdValues, sessionsDays, sessionsHighlights, sessionsValues, resetCodesDays, resetCodesHighlights, resetCodesValues}
}

function renderPage (req, res) {
  const doc = dashboard.HTML.parse(req.html || req.route.html)
  dashboard.HTML.renderList(doc, req.data.createdDays, 'chart-column', 'created-chart')
  dashboard.HTML.renderList(doc, req.data.createdValues, 'chart-value', 'created-values')
  dashboard.HTML.renderTemplate(doc, req.data.createdHighlights, 'metric-highlights', 'created-highlights')
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
