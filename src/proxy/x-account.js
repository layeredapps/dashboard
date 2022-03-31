module.exports = async (req, proxyRequestOptions) => {
  if (!req.account) {
    return
  }
  proxyRequestOptions.headers['x-account'] = JSON.stringify(req.account)
}
