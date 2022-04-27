module.exports = {
  before: allowAPIAccess
}

async function allowAPIAccess (req) {
  if (!req.urlPath.startsWith('/api/')) {
    return
  }
  req.allowAPIRequest = true
}
