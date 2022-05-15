const dashboard = require('../../../index.js')
const navbar = require('./navbar-profile.js')

module.exports = {
  before: beforeRequest,
  get: renderPage,
  post: submitForm
}

async function beforeRequest (req) {
  if (!req.query || !req.query.profileid) {
    req.error = 'invalid-profileid'
    req.data = {
      profile: {
        profileid: ''
      }
    }
    req.removeContents = true
    return
  }
  if (req.query.message === 'success') {
    req.data = {
      profile: {
        default: true,
        profileid: req.query.profileid
      }
    }
    req.removeContents = true
    return
  }
  if (req.account.profileid === req.query.profileid) {
    req.error = 'default-profile'
    req.removeContents = true
    req.data = {
      profile: {
        profileid: req.query.profileid
      }
    }
    return
  }
  let profile
  try {
    profile = await global.api.user.Profile.get(req)
  } catch (error) {
    profile = {
      profileid: req.query.profileid
    }
    req.removeContents = true
    if (error.message === 'invalid-profileid' || error.message === 'invalid-account') {
      req.error = error.message
    } else {
      req.error = 'unknown-error'
    }
  }
  profile.default = profile.profileid === req.account.profileid
  req.data = { profile }
}

function renderPage (req, res, messageTemplate) {
  messageTemplate = req.error || messageTemplate || (req.query ? req.query.message : null)
  const doc = dashboard.HTML.parse(req.html || req.route.html, req.data.profile, 'profile')
  navbar.setup(doc, req.data.profile)
  if (messageTemplate) {
    dashboard.HTML.renderTemplate(doc, null, messageTemplate, 'message-container')
    if (req.removeContents) {
      const submitForm = doc.getElementById('submit-form')
      submitForm.parentNode.removeChild(submitForm)
      return dashboard.Response.end(req, res, doc)
    }
  }
  return dashboard.Response.end(req, res, doc)
}

async function submitForm (req, res) {
  if (!req.body) {
    return renderPage(req, res)
  }
  if (req.account.profileid === req.body.profileid) {
    return renderPage(req, res, 'default-profile')
  }
  try {
    req.query = req.query || {}
    req.query.accountid = req.account.accountid
    req.body.profileid = req.query.profileid
    await global.api.user.SetAccountProfile.patch(req)
  } catch (error) {
    return renderPage(req, res, error.message)
  }
  if (req.query['return-url']) {
    return dashboard.Response.redirect(req, res, req.query['return-url'])
  } else {
    res.writeHead(302, {
      location: `${req.urlPath}?profileid=${req.query.profileid}&message=success`
    })
    return res.end()
  }
}
