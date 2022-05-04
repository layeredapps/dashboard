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
  if (req.query.message !== 'success' && account.deletedAt) {
    req.error = 'invalid-account'
    req.removeContents = true
    return
  }
  account.createdAtFormatted = dashboard.Format.date(account.createdAt)
  account.lastSignedInAtFormatted = dashboard.Format.date(account.lastSignedInAt)
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
  const data = {
    numDays: global.deleteDelay
  }
  dashboard.HTML.renderTemplate(doc, data, 'scheduled-delete', 'message-container')
  return dashboard.Response.end(req, res, doc)
}

async function submitForm (req, res) {
  try {
    await global.api.administrator.SetAccountDeleted.patch(req)
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
