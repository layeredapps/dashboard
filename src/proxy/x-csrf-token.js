const Hash = require('../hash.js')
const url = require('url')

module.exports = addXCRSFToken

async function addXCRSFToken (req, proxyRequestOptions) {
  if (!req.account) {
    return
  }
  let dashboardEncryptionKey = global.dashboardEncryptionKey
  if (req.server) {
    dashboardEncryptionKey = req.server.dashboardEncryptionKey || dashboardEncryptionKey
  }
  const token = Hash.sha512Hash(`${req.session.csrfToken}-${req.session.sessionid}-${req.account.accountid}-${url}`, dashboardEncryptionKey)
  proxyRequestOptions.headers['x-csrf-token'] = token
}
