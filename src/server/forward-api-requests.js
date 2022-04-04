module.exports = {
  before: (req) => {
    req.allowAPIRequest = req.urlPath.startsWith('/api/')
  },
  after: async (req) => {
    if (!req.account || req.route) {
      delete (req.allowAPIRequest)
    }
  }
}
