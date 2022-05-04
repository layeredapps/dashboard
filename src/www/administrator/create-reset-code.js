const crypto = require('crypto')
const dashboard = require('../../../index.js')
const navbar = require('./navbar-account.js')

module.exports = {
  before: beforeRequest,
  get: renderPage,
  post: submitForm
}

async function beforeRequest (req) {
  if (!req.query || !req.query.accountid) {
    req.error = 'invalid-accountid'
    req.removeContents = true
    return
  }
  let account
  try {
    account = await global.api.administrator.Account.get(req)
  } catch (error) {
    req.removeContents = true
    account = {
      accountid: req.query.accountid
    }
    if (error.message === 'invalid-accountid') {
      req.error = error.message
    } else {
      req.error = 'unknown-error'
    }
    req.data = { account }
    return
  }
  if (account.deletedAt) {
    req.error = 'invalid-account'
    req.removeContents = true
  }
  req.data = { account }
}

async function renderPage (req, res, messageTemplate) {
  messageTemplate = req.error || messageTemplate || (req.query ? req.query.message : null)
  const doc = dashboard.HTML.parse(req.html || req.route.html, req.data.account, 'account')
  await navbar.setup(doc, req.data.account)
  if (messageTemplate) {
    dashboard.HTML.renderTemplate(doc, null, messageTemplate, 'message-container')
    if (req.removeContents) {
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
  if (!req.body['secret-code'] || !req.body['secret-code'].length) {
    return renderPage(req, res, 'invalid-secret-code')
  }
  if (req.body['secret-code'].match(/^[a-z0-9]+$/i) === null) {
    return renderPage(req, res, 'invalid-secret-code')
  }
  if (global.minimumResetCodeLength > req.body['secret-code'].length) {
    return renderPage(req, res, 'invalid-secret-code-length')
  }
  try {
    await global.api.administrator.CreateResetCode.post(req)
  } catch (error) {
    return renderPage(req, res, error.message)
  }
  if (req.query['return-url']) {
    return dashboard.Response.redirect(req, res, req.query['return-url'])
  } else {
    res.writeHead(302, {
      location: `${req.urlPath}?accountid=${req.query.accountid}&message=success`
    })
    return res.end()
  }
}
