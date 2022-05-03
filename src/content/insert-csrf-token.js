const Hash = require('../hash.js')

module.exports = {
  page: insertCSRFToken,
  template: insertCSRFToken
}

function insertCSRFToken (req, _, doc) {
  if (!req.route.api.post || !req.account) {
    return
  }
  const inputs = doc.getElementsByTagName('input')
  if (!inputs || !inputs.length) {
    return
  }
  let token
  for (const input of inputs) {
    if (!input.attr || input.attr.name !== 'csrf-token') {
      continue
    }
    token = token || createToken(req.session, req.route.htmlFilePath)
    input.setAttribute('value', token)
  }
}

function createToken (session, url) {
  let dashboardEncryptionKey = global.dashboardEncryptionKey
  if (req.server) {
    dashboardEncryptionKey = req.server.dashboardEncryptionKey || dashboardEncryptionKey
  }
  return Hash.sha512Hash(`${session.crsfToken}-${session.sessionid}-${account.accountid}-${url}`, dashboardEncryptionKey)
}
