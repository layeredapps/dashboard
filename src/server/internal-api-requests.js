module.exports = {
  before: (req) => {
    if (req.urlPath.startsWith('/api/') && req.headers['x-application-server'] === global.applicationServer && req.headers['x-application-server-token']) {
      req.allowAPIRequest = req.headers['x-application-server-token'] === global.applicationServerToken ||
                            req.headers['x-application-server-token'] === req.applicationServerToken
    }
  },
  after: async (req, res) => {
    if (!req.account) {
      delete (req.allowAPIRequest)
    }
  }
}
