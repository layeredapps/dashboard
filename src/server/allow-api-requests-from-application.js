module.exports = {
  before: allowAPIRequestsFromApplication
}

async function allowAPIRequestsFromApplication (req) {
  if (!global.applicationServer) {
    return
  }
  if (!req.urlPath.startsWith('/api/')) {
    return
  }
  if (!req.headers['x-application-server'] || !req.headers['x-application-server-token']) {
    return
  }
  if (req.headers['x-application-server-token'] !== global.applicationServerToken || req.headers['x-application-server-token'] !== req.applicationServerToken) {
    return
  }
  req.allowAPIRequest = true
}
