const Hash = require('../hash.js')
const Log = require('../log.js')('csrf-check')
const Response = require('../response.js')

module.exports = {
  after: checkCSRFToken
}

async function checkCSRFToken (req, res) {
  if (req.method !== 'POST' || !req.route || req.route.auth === false) {
    return
  }
  if (!req.urlPath.startsWith('/account/') && req.urlPath !== '/account' &&
      !req.urlPath.startsWith('/administrator/') && req.urlPath !== '/administrator') {
    return
  }
  if (!req.body || !req.body['csrf-token'] || !req.body['csrf-token'].length) {
    Log.error('csrf-token missing')
    res.ended = true
    if (req.route.api.before) {
      try {
        await req.route.api.before(req)
      } catch (error) {
        Log.error('route error', error)
        return Response.throw500(req, res)
      }
    }
    return req.route.api.get(req, res, 'invalid-csrf-token')
  }
  let dashboardEncryptionKey = global.dashboardEncryptionKey
  if (req.server) {
    dashboardEncryptionKey = req.server.dashboardEncryptionKey || dashboardEncryptionKey
  }
  const token = `${req.session.csrfToken}-${req.session.sessionid}-${req.account.accountid}-${req.route.htmlFilePath}`
  const validToken = Hash.sha512HashCompare(token, req.body['csrf-token'], dashboardEncryptionKey)
  if (!validToken) {
    Log.error('csrf-token invalid')
    res.ended = true
    if (req.route.api.before) {
      try {
        await req.route.api.before(req)
      } catch (error) {
        Log.error('route error', error)
        return Response.throw500(req, res)
      }
    }
    return req.route.api.get(req, res, 'invalid-csrf-token')
  }
}
