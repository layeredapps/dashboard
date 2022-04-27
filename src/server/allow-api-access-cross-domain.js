module.exports = {
  before: allowAPIAccessCrossDomain
}

async function allowAPIAccessCrossDomain (req, res) {
  if (!req.urlPath.startsWith('/api/')) {
    return
  }
  req.allowAPIAccess = true
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Headers', 'content-type')
  res.setHeader('Access-Control-Allow-Methods', 'OPTIONS,PUT,POST,GET,PATCH,DELETE')
}
