const Proxy = require('../proxy.js')
const Response = require('../response.js')

module.exports = {
  after: checkBeforeDeleteAccount
}

async function checkBeforeDeleteAccount (req, res) {
  if (!req.url.startsWith('/account/delete-account')) {
    return
  }
  if (!global.applicationServer) {
    return
  }
  const urlWas = req.url
  if (process.env.CHECK_BEFORE_DELETE_ACCOUNT) {
    req.url = `${process.env.CHECK_BEFORE_DELETE_ACCOUNT}?accountid=${req.account.accountid}`
  } else {
    req.url = `/api/check-before-delete-account?accountid=${req.account.accountid}`
  }
  let response
  try {
    const responseRaw = await dashboard.Proxy.get(req)
    if (responseRaw && responseRaw.toString) {
      response = responseRaw.toString()
    }
  } catch (error) {
  }
  req.url = urlWas
  if (response.startsWith('{')) {
    const result = JSON.parse(response)
    if (result.redirect) {
      return Response.redirect(req, res, result.redirect)
    }
  }
}
