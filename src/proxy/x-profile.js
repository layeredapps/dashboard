module.exports = addXProfileHeader

async function addXProfileHeader (req, proxyRequestOptions) {
  if (!req.account) {
    return
  }
  const queryWas = req.query
  req.query = {
    profileid: req.account.profileid
  }
  const profile = await global.api.user.Profile.get(req)
  req.query = queryWas
  proxyRequestOptions.headers['x-session'] = JSON.stringify(profile)
}
