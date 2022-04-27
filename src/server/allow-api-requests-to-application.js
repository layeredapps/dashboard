module.exports = {
  before: allowAPIRequestsToApplication
}

async function allowAPIRequestsToApplication (req) {
  if (!global.applicationServer) {
    return
  }
  if (!req.urlPath.startsWith('/api/')) {
    return
  }
  if (req.route) {
    return
  }
  req.allowAPIRequest = true
}
