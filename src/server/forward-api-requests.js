module.exports = {
  before: (req) => {
    if (req.urlPath.startsWith('/api/') && !req.urlPath.startsWith('/api/user/') && !req.urlPath.startsWith('/api/administrator')) {
      req.allowAPIRequest = true
    }
  },
  after: async (req, res) => {
    if (!req.account) {
        delete (req.allowAPIRequest)
    }
  }
}