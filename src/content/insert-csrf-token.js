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
    let dashboardEncryptionKey = global.dashboardEncryptionKey
    if (req.server) {
      dashboardEncryptionKey = req.server.dashboardEncryptionKey || dashboardEncryptionKey
    }
    token = token || createToken(req.session, req.route.htmlFilePath, dashboardEncryptionKey)
    input.setAttribute('value', token)
  }
}

function createToken (session, url, dashboardEncryptionKey) {
  return Hash.sha512Hash(`${session.csrfToken}-${session.sessionid}-${session.accountid}-${url}`, dashboardEncryptionKey)
}
