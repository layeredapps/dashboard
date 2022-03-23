const dashboard = require('@layeredapps/dashboard')
const Proxy = require('../proxy.js')

module.exports = {
  after: async (req, res) => {
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
    const response = await Proxy.get(req)
    req.url = urlWas
    if (response.redirect) {
      return dashboard.Response.redirect(req, res, response.redirect)
    }
  }
}
