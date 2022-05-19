// Fetches and caches public files from your application server
// like CSS overrides or favicon overrides, if they are not found
// the default assets are loaded from Dashboard or its modules. The
// files are cached for default 60 seconds so if you push a new application
// build it will take one minute for changes to propagate.
//
// todo: it's possible more root text or icon files need supporting

const Proxy = require('../proxy.js')
const Response = require('../response.js')
const cache = {}
const lastFetched = {}
const nonexistent = {}

module.exports = {
  before: fetchApplicationServerPublicFile
}

async function fetchApplicationServerPublicFile (req, res) {
  if (!global.applicationServer) {
    return
  }
  if (!req.urlPath.startsWith('/public/') &&
       req.urlPath !== '/robots.txt' &&
       req.urlPath !== '/favicon.ico' &&
       req.urlPath !== '/') {
    return
  }
  const now = new Date()
  // expire old cached repsonses
  if (lastFetched[req.urlPath]) {
    if (now.getTime() - lastFetched[req.urlPath].getTime() > global.cacheApplicationServerFiles * 1000) {
      nonexistent[req.urlPath] = null
      cache[req.urlPath] = null
    }
  }
  // abort if a cached nonexistence exists
  if (nonexistent[req.urlPath]) {
    return
  }
  const mimeType = Response.mimeTypes[req.extension === 'jpeg' ? 'jpg' : req.extension] || Response.mimeTypes.html
  // shortcircuit if a cached file exists
  if (cache[req.urlPath]) {
    res.setHeader('content-type', mimeType)
    res.statusCode = 200
    res.ended = true
    return res.end(cache[req.url])
  }
  // cache the file or its nonexistence
  lastFetched[req.urlPath] = now
  let contents
  try {
    contents = await Proxy.get({
      url: `${global.applicationServer}/${req.urlPath}`
    })
  } catch (error) {
  }
  if (!contents) {
    nonexistent[req.urlPath] = true
    return
  }
  cache[req.urlPath] = contents
  res.setHeader('content-type', mimeType)
  res.statusCode = 200
  res.ended = true
  return res.end(contents)
}
