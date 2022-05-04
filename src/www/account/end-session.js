const dashboard = require('../../../index.js')
const navbar = require('./navbar-profile.js')

module.exports = {
  before: beforeRequest,
  get: renderPage,
  post: submitForm
}

async function beforeRequest (req) {
  if (!req.query || !req.query.sessionid) {
    req.error = 'invalid-sessionid'
    req.removeContents = true
    return
  }
  if (req.query.message === 'success') {
    req.removeContents = true
    req.data = {
      session: {
        sessionid: req.query.sessionid
      }
    }
    return
  }
  let session
  try {
    session = await global.api.user.Session.get(req)
  } catch (error) {
    session = {
      sessionid: req.query.sessionid
    }
    req.removeContents = true
    if (error.message === 'invalid-account' || error.message === 'invalid-sessionid') {
      req.error = error.message
    } else {
      req.error = 'unknown-error'
    }
  }
  if (session.ended) {
    req.error = 'invalid-session'
    req.removeContents = true
  }
  req.data = { session }
}

async function renderPage (req, res, messageTemplate) {
  messageTemplate = req.error || messageTemplate || (req.query ? req.query.message : null)
  const doc = dashboard.HTML.parse(req.html || req.route.html, req.data.session, 'session')
  await navbar.setup(doc, req.data.session)
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
    await global.api.user.SetSessionEnded.patch(req)
  } catch (error) {
    return renderPage(req, res, 'unknown-error')
  }
  if (req.query.sessionid === req.session.sessionid) {
    req.query = {}
    req.urlPath = req.url = global.homePath || '/home'
    return dashboard.Response.redirectToSignIn(req, res)
  }
  if (req.query['return-url']) {
    return dashboard.Response.redirect(req, res, req.query['return-url'])
  } else {
    res.writeHead(302, {
      location: `${req.urlPath}?sessionid=${req.query.sessionid}&message=success`
    })
    return res.end()
  }
}
