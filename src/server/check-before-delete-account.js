const dashboard = require('@layeredapps/dashboard')
const Proxy = require('./proxy.js')

module.exports = {
  after: async (req, res) => {
    if (!req.url.startsWith('/account/delete-account')) {
      return
    }
    const requestObject = {}
    if (process.env.CHECK_BEFORE_DELETE_ACCOUNT) {
      requestObject.url = `${process.env.CHECK_BEFORE_DELETE_ACCOUNT}?accountid=${req.account.accountid}`
    } else {
      requestObject.url = `/api/check-before-delete-account?accountid=${req.account.accountid}`
    }
    const response = await Proxy.get(requestObject)
    if (response.redirect) {
      return dashboard.Response.redirect(req, res, response.redirect)
    }
  }
}
