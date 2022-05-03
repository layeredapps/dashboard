const Hash = require('../hash.js')

module.exports = addXCRSFToken

async function addXCRSFToken (req, proxyRequestOptions) {
  let dashboardEncryptionKey = global.dashboardEncryptionKey
  if (req.server) {
    dashboardEncryptionKey = req.server.dashboardEncryptionKey || dashboardEncryptionKey
  }
  const token = Hash.sha512Hash(`${session.crsfToken}-${session.sessionid}-${account.accountid}-${url}`, dashboardEncryptionKey)
  proxyRequestOptions.headers['x-csrf-token'] = token
}
