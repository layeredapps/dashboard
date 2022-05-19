// Fetches and caches special HTML files from your application
// server like template and error page overrides.  If they are
// not found the default pages are loaded from Dashboard. The
// files are cached for default 60 seconds so if you push a new
// application build it will take one minute for changes to propagate.

const Proxy = require('../proxy.js')
const files = ['template.html', 'error.html', 'redirect.html', 'menu-account.html', 'menu-administrator.html']
const cache = {}
const lastFetched = {}
const nonexistent = {}

module.exports = {
  before: fetchApplicationServerSpecialHTML
}

async function fetchApplicationServerSpecialHTML (req) {
  if (!global.applicationServer) {
    return
  }
  const now = new Date()
  for (const file of files) {
    const url = `${global.applicationServer}/${file}`
    // expire old cached responses
    if (lastFetched[url]) {
      if (now.getTime() - lastFetched[url].getTime() > global.cacheApplicationServerFiles * 1000) {
        cache[url] = null
        nonexistent[url] = null
      }
    }
    // abort if the file is nonexistent
    if (nonexistent[url]) {
      return
    }
    let prefix = file.split('.').shift()
    if (prefix === 'menu-account') {
      prefix = 'menuAccount'
    } else if (prefix === 'menu-administrator') {
      prefix = 'menuAdministrator'
    }
    // abort if the file is cached
    if (cache[url]) {
      if (req.packageJSON) {
        req.packageJSON.dashboard[`${prefix}HTML`] = cache[url]
        req.packageJSON.dashboard[`${prefix}HTMLPath`] = url
      } else {
        global.packageJSON.dashboard[`${prefix}HTML`] = cache[url]
        global.packageJSON.dashboard[`${prefix}HTMLPath`] = url
      }
      return
    }
    // load from the server
    lastFetched[url] = now
    let contents
    try {
      contents = await Proxy.get({ url })
      if (contents && contents.toString) {
        contents = contents.toString()
      }
    } catch (error) {
    }
    if (!contents || !contents.length) {
      nonexistent[url] = true
    } else {
      // update the global configuration
      if (req.packageJSON) {
        req.packageJSON.dashboard[`${prefix}HTML`] = contents
        req.packageJSON.dashboard[`${prefix}HTMLPath`] = url
        cache[url] = contents
      } else {
        global.packageJSON.dashboard[`${prefix}HTML`] = contents
        global.packageJSON.dashboard[`${prefix}HTMLPath`] = url
        cache[url] = contents
      }
    }
  }
}
