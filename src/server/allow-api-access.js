module.exports = {
  before: (req) => {
    if (!req.urlPath.startsWith('/api/')) {
      return
    }
    req.allowAPIRequest = true
  }
}
