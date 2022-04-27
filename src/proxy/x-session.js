module.exports = addXSessionHeader

async function addXSessionHeader (req, proxyRequestOptions) {
  if (!req.account) {
    return
  }
  proxyRequestOptions.headers['x-session'] = JSON.stringify(req.session)
}
