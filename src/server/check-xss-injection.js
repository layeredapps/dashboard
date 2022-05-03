const Response = require('../response.js')
const Validate = require('../validate.js')

module.exports = {
  before: checkXSS,
  after: checkXSS
}

function checkXSS (req, res) {
  // application server is responsible for its own checking
  if (!req.route) {
    return
  }
  if (req.query && !Validate.xssCheck(req.query)) {
    // for API return a JSON error
    if (req.urlPath.startsWith('/api/')) {
      Log.error('api xss error in url parameters', req.url, error)
      res.statusCode = 500
      res.setHeader('content-type', 'application/json; charset=utf-8')
      return res.end(`{ "object": "error", "message": "${error.message || 'An error ocurred'}" }`)
    }
    // for HTML redirect to error page
    return Response.throw500(req, res, 'invalid-input')
  }
  if (req.body && !Validate.xssCheck(req.body)) {
    // for API return a JSON error
    if (req.urlPath.startsWith('/api/')) {
      Log.error('api xss error in body parameters', error)
      res.statusCode = 500
      res.setHeader('content-type', 'application/json; charset=utf-8')
      return res.end(`{ "object": "error", "message": "invalid-input" }`)
    }
    // for HTML render a PAGE error
    return req.route.api.get(req, res, 'invalid-input')
  }
}