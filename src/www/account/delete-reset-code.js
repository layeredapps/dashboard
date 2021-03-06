const dashboard = require('../../../index.js')

module.exports = {
  before: beforeRequest,
  get: renderPage,
  post: submitForm
}

async function beforeRequest (req) {
  if (!req.query || !req.query.codeid) {
    req.error = 'invalid-reset-codeid'
    req.removeContents = true
    return
  }
  if (req.query.message === 'success') {
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
    resetCode = await global.api.user.ResetCode.get(req)
  } catch (error) {
    req.removeContents = true
    req.data = {
      resetCode: {
        codeid: req.query.codeid
      }
    }
    if (error.message === 'invalid-account' || error.message === 'invalid-reset-codeid') {
      req.error = error.message
    } else {
      req.error = 'unknown-error'
    }
    return
  }
  resetCode.createdAtFormatted = dashboard.Format.date(resetCode.createdAt)
  req.data = { resetCode }
}

function renderPage (req, res, messageTemplate) {
  messageTemplate = req.error || messageTemplate || (req.query ? req.query.message : null)
  const doc = dashboard.HTML.parse(req.html || req.route.html, req.data.resetCode, 'resetCode')
  if (messageTemplate) {
    dashboard.HTML.renderTemplate(doc, null, messageTemplate, 'message-container')
    if (req.removeContents) {
      const submitForm = doc.getElementById('submit-form')
      submitForm.parentNode.removeChild(submitForm)
    }
  } else {
    dashboard.HTML.renderTemplate(doc, null, 'instant-delete', 'message-container')
  }
  return dashboard.Response.end(req, res, doc)
}

async function submitForm (req, res) {
  try {
    await global.api.user.DeleteResetCode.delete(req)
  } catch (error) {
    return renderPage(req, res, error.message)
  }
  if (req.query['return-url']) {
    return dashboard.Response.redirect(req, res, req.query['return-url'])
  } else {
    res.writeHead(302, {
      location: `${req.urlPath}?codeid=${req.query.codeid}&message=success`
    })
    return res.end()
  }
}
