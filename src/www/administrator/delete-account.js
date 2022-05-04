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
    req.data = {
      account: {
        accountid: req.query.accountid
      }
    }
    return
  }
  if (req.query.message === 'success') {
    req.data = {
      account: {
        accountid: req.query.accountid
      }
    }
    req.removeContents = true
    return
  }
  let account
  try {
    account = await global.api.administrator.Account.get(req)
  } catch (error) {
    req.removeContents = true
    req.data = {
      account: {
        accountid: req.query.accountid
      }
    }
    if (error.message === 'invalid-accountid') {
      req.error = error.message
    } else {
      req.error = 'unknown-error'
    }
    return
  }
  if (!account.deletedAt) {
    req.error = 'invalid-account-not-deleting'
    req.removeContents = true
    req.data = {
      account: {
        accountid: req.query.accountid
      }
    }
  }
  if (account.owner) {
    req.error = 'invalid-owner-account'
    req.removeContents = true
    req.data = {
      account: {
        accountid: req.query.accountid
      }
    }
    return
  }
  if (account.administrator) {
    req.error = 'invalid-administrator-account'
    req.removeContents = true
    req.data = {
      account: {
        accountid: req.query.accountid
      }
    }
    return
  }
  if (account.createdAt) {
    account.createdAtFormatted = dashboard.Format.date(account.createdAt)
  }
  if (account.lastSignedInAt) {
    account.lastSignedInAtFormatted = dashboard.Format.date(account.lastSignedInAt)
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
    }
  }
  return dashboard.Response.end(req, res, doc)
}

async function submitForm (req, res) {
  try {
    await global.api.administrator.DeleteAccount.delete(req)
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
