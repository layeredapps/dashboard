// during development this script forces files from /public
// to reload so changes can be observed without restart
const server = require('../server.js')

module.exports = {
  before: uncacheFiles
}

async function uncacheFiles (req, res) {
  if (process.env.NODE_ENV !== 'development') {
    return
  }
  if (req.route || !req.urlPath.startsWith('/public/')) {
    return
  }
  for (const key in server.fileCache) {
    delete (server.fileCache[key])
  }
  for (const key in server.statCache) {
    delete (server.statCache[key])
  }
}
