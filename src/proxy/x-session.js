module.exports = async (req, proxyRequestOptions) => {
  if (!req.account) {
    return
  }
  proxyRequestOptions.headers['x-session'] = JSON.stringify(req.session)
}
