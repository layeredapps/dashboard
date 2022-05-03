// during development this script forces routes to
// reload so changes can be observed without restart
const fs = require('fs')

module.exports = {
  before: reloadRoute
}

async function reloadRoute (req, res) {
  if (process.env.NODE_ENV !== 'development') {
    return
  }
  if (!req.route) {
    return
  }
  if (req.route.jsFileExists) {
    delete require.cache[require.resolve(req.route.jsFilePathFull)]
    req.route.api = require(req.route.jsFilePathFull)
  }
  if (req.route.htmlFileExists) {
    req.route.html = fs.readFileSync(req.route.htmlFilePathFull).toString()
  }
}
