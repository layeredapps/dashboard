const Hash = require('../hash.js')

module.exports = {
  after: checkCSRFToken
}

async function checkCSRFToken (req, res) {
  if (!req.body || !req.route) {
    return
  }
  if (req.urlPath.startsWith('/api/')) {
    return
  }
  if (!req.body['csrf-token'] || !req.body['csrf-token'].length) {
    res.ended = true
    return req.route.api.get(req, res, 'invalid-csrf-token')
  }
  let dashboardEncryptionKey = global.dashboardEncryptionKey
  if (req.server) {
    dashboardEncryptionKey = req.server.dashboardEncryptionKey || dashboardEncryptionKey
  }
  const token = `${req.session.crsfToken}-${req.session.sessionid}-${req.account.accountid}-${req.route.htmlFilePath}`
  const validToken = Hash.sha512HashCompare(token, req.body['csrf-token'], dashboardEncryptionKey)
  if (!validToken) {
    res.ended = true
    return req.route.api.get(req, res, 'invalid-csrf-token')
  }
}
