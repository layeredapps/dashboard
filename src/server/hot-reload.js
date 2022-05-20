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
  before: hotReloadFiles
}

async function hotReloadFiles (req, res) {
  // the server caches file blobs and stats
  for (const key in server.fileCache) {
    delete (server.fileCache[key])
  }
  for (const key in server.statCache) {
    delete (server.statCache[key])
  }
  // nodejs caches 'require' references
  Object.keys(require.cache).forEach((key) => {
    // don't uncache Dashboard because storage etc won't be set up
    if (key.endsWith('dashboard/index.js')) {
      return
    }
    // don't uncache modules because storage etc won't be set up
    if (global.packageJSON && global.packageJSON.dashboard && global.packageJSON.dashboard.moduleNames) {
      for (const name of global.packageJSON.dashboard.moduleNames) {
        if (key.endsWith(`${name}/index.js`)) {
          return
        }
      }
    }
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
  // content, proxy and server scripts
  for (let i = 0, len = global.packageJSON.dashboard.serverFilePaths.length; i < len; i++) {
    global.packageJSON.dashboard.server[i] = require(global.packageJSON.dashboard.serverFilePaths[i])
  }
  for (let i = 0, len = global.packageJSON.dashboard.contentFilePaths.length; i < len; i++) {
    global.packageJSON.dashboard.content[i] = require(global.packageJSON.dashboard.contentFilePaths[i])
  }
  for (let i = 0, len = global.packageJSON.dashboard.proxyFilePaths.length; i < len; i++) {
    global.packageJSON.dashboard.proxy[i] = require(global.packageJSON.dashboard.proxyFilePaths[i])
  }
}
