const dashboard = require('../../../index.js')

module.exports = {
  before: beforeRequest,
  get: renderPage
}

async function beforeRequest (req) {
  if (!req.query || !req.query.codeid) {
    req.error = 'invalid-reset-codeid'
    req.removeContents = true
    req.data = {
      resetCode: {
        codeid: req.query.codeid
      }
    }
    return
  }
  let resetCode
  try {
    resetCode = await global.api.administrator.ResetCode.get(req)
  } catch (error) {
    req.removeContents = true
    req.data = {
      resetCode: {
        codeid: req.query.codeid
      }
    }
    if (error.message === 'invalid-reset-codeid') {
      req.error = error.message
    } else {
      req.error = 'unknown-error'
    }
    return
  }
  if (resetCode.createdAt) {
    resetCode.createdAtFormatted = dashboard.Format.date(resetCode.createdAt)
  }
  req.data = { resetCode }
}

async function renderPage (req, res, messageTemplate) {
  messageTemplate = req.error || messageTemplate || (req.query ? req.query.message : null)
  const doc = dashboard.HTML.parse(req.html || req.route.html, req.data.resetCode, 'resetCode')
  if (messageTemplate) {
    dashboard.HTML.renderTemplate(doc, null, messageTemplate, 'message-container')
    if (req.removeContents) {
      const resetCodesTable = doc.getElementById('reset-codes-table')
      resetCodesTable.parentNode.removeChild(resetCodesTable)
    }
  }
  return dashboard.Response.end(req, res, doc)
}
