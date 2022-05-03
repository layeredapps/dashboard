// during development this script forces routes to
// reload so changes can be observed without restart

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
  if (route.jsFileExists) {
    delete require.cache[require.resolve(route.jsFilePathFull)]
    route.api = require(route.jsFilePathFull)
  }
  if (route.htmlFileExists) {
    route.html = fs.readFileSync(route.htmlFilePathFull).toString()
  }
}
