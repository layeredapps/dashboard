const dashboard = require('@layeredapps/dashboard')

module.exports = {
  after: async (req, res) => {
    if (!req.url.startsWith('/account/delete-account')) {
      return
    }
    const requestObject = {}
    if (process.env.CHECK_BEFORE_DELETE_ACCOUNT) {
      requestObject.url = `${process.env.CHECK_BEFORE_DELETE_ACCOUNT}?accountid=${req.query.accountid}`
    } else {
      requestObject.url = `/api/check-before-delete-account?accountid=${req.query.accountid}`
    }
    const response = await dashboard.Proxy.get(requestObject)
    if (response.redirect) {
      return dashboard.Response.redirect(req, res, response.redirect)
    }
  }
}
