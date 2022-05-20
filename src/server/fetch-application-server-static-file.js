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
  const url = `${global.applicationServer}${req.urlPath}`
  if (lastFetched[url]) {
    if (now.getTime() - lastFetched[url].getTime() > global.cacheApplicationServerFiles * 1000) {
      nonexistent[url] = null
      cache[url] = null
    }
  }
  if (nonexistent[url]) {
    return
  }
  const mimeType = Response.mimeTypes[req.extension === 'jpeg' ? 'jpg' : req.extension] || Response.mimeTypes.html
  if (cache[url]) {
    res.setHeader('content-type', mimeType)
    res.statusCode = 200
    res.ended = true
    return res.end(cache[url])
  }
  lastFetched[url] = now
  let contents
  try {
    contents = await Proxy.get({ url })
  } catch (error) {
  }
  if (!contents || !contents.length) {
    nonexistent[url] = true
    return
  }
  cache[url] = contents
  res.setHeader('content-type', mimeType)
  res.statusCode = 200
  res.ended = true
  return res.end(contents)
}
