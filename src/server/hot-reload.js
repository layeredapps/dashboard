// During development this forces files to reload
// by purging the 'require' cache, various caches
// the server sets to remember disk operations,
// and reloading route files.
//
// This file is automatically activated if you set
// the environment variable HOT_RELOAD=true but
// in production you should allow the caching.
const fs = require('fs')
const server = require('../server.js')

module.exports = {
  before: uncacheFiles
}

async function uncacheFiles (req, res) {
  // the server caches file blobs and stats
  for (const key in server.fileCache) {
    delete (server.fileCache[key])
  }
  for (const key in server.statCache) {
    delete (server.statCache[key])
  }
  // nodejs caches 'require' references
  Object.keys(require.cache).forEach((key) => {
    delete (require.cache[key])
  })
  // routes cache HTML and JS handlers
  if (req.route) {
    if (req.route.jsFileExists) {
      delete require.cache[require.resolve(req.route.jsFilePathFull)]
      req.route.api = require(req.route.jsFilePathFull)
    }
    if (req.route.htmlFileExists) {
      req.route.html = fs.readFileSync(req.route.htmlFilePathFull).toString()
    }
  }
}
