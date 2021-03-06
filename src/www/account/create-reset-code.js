const crypto = require('crypto')
const dashboard = require('../../../index.js')

module.exports = {
  get: renderPage,
  post: submitForm
}

function renderPage (req, res, messageTemplate) {
  messageTemplate = messageTemplate || (req.query ? req.query.message : null)
  const doc = dashboard.HTML.parse(req.html || req.route.html)
  if (messageTemplate) {
    dashboard.HTML.renderTemplate(doc, null, messageTemplate, 'message-container')
    if (req.removeContents || messageTemplate === 'success') {
      const submitForm = doc.getElementById('submit-form')
      submitForm.parentNode.removeChild(submitForm)
      return dashboard.Response.end(req, res, doc)
    }
  }
  const note = {
    object: 'note',
    min: global.minimumResetCodeLength,
    max: global.maximumResetCodeLength
  }
  dashboard.HTML.renderTemplate(doc, note, 'alphanumeric-note', 'note-container')
  const codeField = doc.getElementById('secret-code')
  if (req.body && req.body['secret-code']) {
    codeField.setAttribute('value', dashboard.Format.replaceQuotes(req.body['secret-code']))
  } else {
    codeField.setAttribute('value', crypto.randomBytes(Math.ceil(global.minimumResetCodeLength / 2)).toString('hex'))
  }
  return dashboard.Response.end(req, res, doc)
}

async function submitForm (req, res) {
  if (!req.body) {
    return renderPage(req, res)
  }
  if (req.query && req.query.message === 'success') {
    return renderPage(req, res)
  }
  req.body['secret-code'] = req.body['secret-code'] && req.body['secret-code'].trim ? req.body['secret-code'].trim() : req.body['secret-code']
  if (!req.body['secret-code'] || !req.body['secret-code'].length) {
    return renderPage(req, res, 'invalid-secret-code')
  }
  if (req.body['secret-code'].match(/^[a-z0-9]+$/i) === null) {
    return renderPage(req, res, 'invalid-secret-code')
  }
  if (global.minimumResetCodeLength > req.body['secret-code'].length || global.maximumResetCodeLength < req.body['secret-code'].length) {
    return renderPage(req, res, 'invalid-secret-code-length')
  }
  req.query = req.query || {}
  req.query.accountid = req.account.accountid
  try {
    await global.api.user.CreateResetCode.post(req)
  } catch (error) {
    return renderPage(req, res, error.message)
  }
  if (req.query['return-url']) {
    return dashboard.Response.redirect(req, res, req.query['return-url'])
  }
  res.writeHead(302, {
    location: `${req.urlPath}?message=success`
  })
  return res.end()
}
