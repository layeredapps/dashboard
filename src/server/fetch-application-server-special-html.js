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

async function fetchApplicationServerSpecialHTML () {
  if (!global.applicationServer) {
    return
  }
  const now = new Date()
  for (const file of files) {
    // expire old cached responses
    if (lastFetched[file]) {
      if (now.getTime() - lastFetched[file].getTime() > global.cacheApplicationServerFiles * 1000) {
        cache[file] = null
        nonexistent[file] = null
      }
    }
    // abort if the file is already cached or nonexistent
    if (cache[file] || nonexistent[file]) {
      return
    }
    // load from the server
    lastFetched[file] = now
    let contents
    try {
      contents = await Proxy.get({
        url: `${global.applicationServer}/${file}`
      })
      if (contents && contents.toString) {
        contents = contents.toString()
      }
    } catch (error) {
    }
    if (!contents || !contents.length) {
      nonexistent[file] = true
    } else {
      // update the global configuration
      global.packageJSON.dashboard[`${file}HTML`] = contents
      global.packageJSON.dashboard[`${file}HTMLPath`] = `${global.applicationServer}/${file}`
      cache[file] = contents
    }
  }
}
