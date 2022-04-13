const dashboard = require('../../../index.js')

module.exports = {
  before: beforeRequest,
  get: renderPage
}

async function beforeRequest (req) {
  const total = await global.api.administrator.ResetCodesCount.get(req)
  const resetCodes = await global.api.administrator.ResetCodes.get(req)
  if (resetCodes && resetCodes.length) {
    for (const resetCode of resetCodes) {
      resetCode.createdAtFormatted = dashboard.Format.date(resetCode.createdAt)
      req.query.accountid = resetCode.accountid
      const account = await global.api.administrator.ResetCode.get(req)
      resetCode.firstName = account.firstName
      resetCode.lastName = account.lastName
      if (account.profileid) {
        req.query.profileid = account.profileid
        const profile = await global.api.administrator.Profile.get(req)
        resetCode.contactEmail = profile.contactEmail
      } else {
        resetCode.contactEmail = '-'
      }
    }
  }
  const offset = req.query ? req.query.offset || 0 : 0
  let createdChartDays, createdChartHighlights, createdChartValues, usedChartDays, usedChartHighlights, usedChartValues
  if (offset === 0) {
    // resetcodes-created chart
    req.query.keys = dashboard.Metrics.metricKeys('resetcodes-created', 365).join(',')
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
    // resetcodes-used chart
    req.query.keys = dashboard.Metrics.metricKeys('resetcodes-used', 365).join(',')
    const usedChart = await global.api.administrator.MetricKeys.get(req)
    const usedChartMaximum = dashboard.Metrics.maximumDay(usedChart)
    usedChartDays = dashboard.Metrics.days(usedChart, usedChartMaximum)
    usedChartHighlights = dashboard.Metrics.highlights(usedChart, usedChartDays)
    usedChartValues = [
      { object: 'object', value: usedChartMaximum },
      { object: 'object', value: Math.floor(usedChartMaximum * 0.75) },
      { object: 'object', value: Math.floor(usedChartMaximum * 0.5) },
      { object: 'object', value: Math.floor(usedChartMaximum * 0.25) },
      { object: 'object', value: 0 }
    ]
  }
  req.data = { resetCodes, total, offset, createdChartDays, createdChartHighlights, createdChartValues, usedChartDays, usedChartHighlights, usedChartValues }
}

async function renderPage (req, res) {
  const doc = dashboard.HTML.parse(req.html || req.route.html)
  if (req.data.resetCodes && req.data.resetCodes.length) {
    dashboard.HTML.renderTable(doc, req.data.resetCodes, 'reset-code-row', 'reset-codes-table')
    if (req.data.total <= global.pageSize) {
      const pageLinks = doc.getElementById('page-links')
      pageLinks.parentNode.removeChild(pageLinks)
    } else {
      dashboard.HTML.renderPagination(doc, req.data.offset, req.data.total)
    }
    const noResetCodes = doc.getElementById('no-reset-codes')
    noResetCodes.parentNode.removeChild(noResetCodes)
    if (req.data.createdChartDays && req.data.createdChartDays.length) {
      dashboard.HTML.renderList(doc, req.data.createdChartDays, 'chart-column', 'created-chart')
      dashboard.HTML.renderList(doc, req.data.createdChartValues, 'chart-value', 'created-values')
      dashboard.HTML.renderTemplate(doc, req.data.createdChartHighlights, 'metric-highlights', 'created-highlights')
    } else {
      const createdChartContainer = doc.getElementById('created-chart-container')
      createdChartContainer.parentNode.removeChild(createdChartContainer)  
    }
    if (req.data.usedChartDays && req.data.usedChartDays.length) {
      dashboard.HTML.renderList(doc, req.data.usedChartDays, 'chart-column', 'used-chart')
      dashboard.HTML.renderList(doc, req.data.usedChartValues, 'chart-value', 'used-values')
      dashboard.HTML.renderTemplate(doc, req.data.usedChartHighlights, 'metric-highlights', 'used-highlights')
    } else {
      const usedChartContainer = doc.getElementById('used-chart-container')
      usedChartContainer.parentNode.removeChild(usedChartContainer)  
    }
  } else {
    const createdChartContainer = doc.getElementById('created-chart-container')
    createdChartContainer.parentNode.removeChild(createdChartContainer)  
    const usedChartContainer = doc.getElementById('used-chart-container')
    usedChartContainer.parentNode.removeChild(usedChartContainer)  
    const resetCodesTable = doc.getElementById('reset-codes-table')
    resetCodesTable.parentNode.removeChild(resetCodesTable)
  }
  return dashboard.Response.end(req, res, doc)
}
