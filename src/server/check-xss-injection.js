const Log = require('../log.js')('xss-check')
const Response = require('../response.js')
const Validate = require('../validate.js')

module.exports = {
  after: checkXSS
}

async function checkXSS (req, res) {
  // application server is responsible for its own checking
  if (!req.route) {
    return
  }
  if (req.query && !Validate.xssCheck(req.query)) {
    res.ended = true
    // for API return a JSON error
    if (req.urlPath.startsWith('/api/')) {
      Log.error('api xss error in url parameters')
      res.statusCode = 500
      res.setHeader('content-type', 'application/json; charset=utf-8')
      return res.end('{ "object": "error", "message": "invalid-url-parameter" }')
    }
    // for HTML redirect to error page
    return Response.throw500(req, res, 'invalid-xss-input')
  }
  if (req.body && !Validate.xssCheck(req.body)) {
    res.ended = true
    // for API return a JSON error
    if (req.urlPath.startsWith('/api/')) {
      Log.error('api xss error in body parameters')
      res.statusCode = 500
      res.setHeader('content-type', 'application/json; charset=utf-8')
      return res.end('{ "object": "error", "message": "invalid-xss-input" }')
    }
    // for HTML render a PAGE error
    if (req.route.api.before) {
      try {
        await req.route.api.before(req)
      } catch (error) {
        Log.error('route error', error)
        return Response.throw500(req, res)
      }
    }
    return req.route.api.get(req, res, 'invalid-xss-input')
  }
}
