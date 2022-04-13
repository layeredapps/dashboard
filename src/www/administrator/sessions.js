const dashboard = require('../../../index.js')

module.exports = {
  before: beforeRequest,
  get: renderPage
}

async function beforeRequest (req) {
  const total = await global.api.administrator.SessionsCount.get(req)
  const sessions = await global.api.administrator.Sessions.get(req)
  if (sessions && sessions.length) {
    req.query = req.query || {}
    for (const session of sessions) {
      session.createdAtFormatted = dashboard.Format.date(session.createdAt)
      session.expiresFormatted = dashboard.Format.date(session.expiresAt)
      req.query.accountid = session.accountid
      const account = await global.api.administrator.Account.get(req)
      session.firstName = account.firstName
      session.lastName = account.lastName
      if (account.profileid) {
        req.query.profileid = account.profileid
        const profile = await global.api.administrator.Profile.get(req)
        session.contactEmail = profile.contactEmail
      }
    }
  }
  const offset = req.query ? req.query.offset || 0 : 0
  let createdChartDays, createdChartHighlights, createdChartValues
  if (offset === 0) {
    // sessions-created chart
    req.query.keys = dashboard.Metrics.metricKeys('sessions-created', 365).join(',')
    const createdChart = await global.api.administrator.MetricKeys.get(req)
    const createdChartMaximum = dashboard.Metrics.maximumDay(createdChart)
    createdChartDays = dashboard.Metrics.days(createdChart, createdChartMaximum)
    createdChartHighlights = dashboard.Metrics.highlights(createdChart, createdChartDays)
    createdChartValues = [
      { object: 'object', value: createdChartMaximum },
      { object: 'object', value: Math.floor(createdChartMaximum * 0.75) },
      { object: 'object', value: Math.floor(createdChartMaximum * 0.5) },
      { object: 'object', value: Math.floor(createdChartMaximum * 0.25) },
      { object: 'object', value: 0 }
    ]
  }
  req.data = { sessions, total, offset, createdChartDays, createdChartValues, createdChartHighlights }
}

async function renderPage (req, res) {
  const doc = dashboard.HTML.parse(req.html || req.route.html)
  if (req.data.sessions && req.data.sessions.length) {
    dashboard.HTML.renderTable(doc, req.data.sessions, 'session-row', 'sessions-table')
    if (req.data.total <= global.pageSize) {
      const pageLinks = doc.getElementById('page-links')
      pageLinks.parentNode.removeChild(pageLinks)
    } else {
      dashboard.HTML.renderPagination(doc, req.data.offset, req.data.total)
    }
    const noSessions = doc.getElementById('no-sessions')
    noSessions.parentNode.removeChild(noSessions)
    if (req.data.createdChartDays && req.data.createdChartDays.length) {
      dashboard.HTML.renderList(doc, req.data.createdChartDays, 'chart-column', 'created-chart')
      dashboard.HTML.renderList(doc, req.data.createdChartValues, 'chart-value', 'created-values')
      dashboard.HTML.renderTemplate(doc, req.data.createdChartHighlights, 'metric-highlights', 'created-highlights')
    } else {
      const createdChart = doc.getElementById('created-chart-container')
      createdChart.parentNode.removeChild(createdChart)
    }
  } else {
    const sessionsTable = doc.getElementById('sessions-table')
    sessionsTable.parentNode.removeChild(sessionsTable)
    const createdChart = doc.getElementById('created-chart-container')
    createdChart.parentNode.removeChild(createdChart)
  }
  return dashboard.Response.end(req, res, doc)
}
