const Hash = require('../hash.js')

module.exports = {
  after: checkCSRFToken
}

async function checkCSRFToken (req, res) {
  if (!req.body || !req.route) {
    return
  }
  if (!req.body['csrf-token'] || !req.body['csrf-token'].length) {
    return route.api.get(req, res, 'invalid-csrf-token')
  }
  let dashboardEncryptionKey = global.dashboardEncryptionKey
  if (req.server) {
    dashboardEncryptionKey = req.server.dashboardEncryptionKey || dashboardEncryptionKey
  }
  const token = `${session.crsfToken}-${session.sessionid}-${account.accountid}-${route.htmlFilePath}`
  const validToken = Hash.sha512HashCompare(token, tokenHash, dashboardEncryptionKey)
  if (!validToken) {
    return route.api.get(req, res, 'invalid-csrf-token')
  }
}
