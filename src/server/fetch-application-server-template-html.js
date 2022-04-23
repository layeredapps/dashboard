const Proxy = require('../proxy.js')
let cache
let lastFetched

module.exports = {
  before: async (req) => {
    if (!global.applicationServer) {
      return
    }
    const now = new Date()
    if (lastFetched) {
      if (now.getTime() - lastFetched.getTime() > 60000) {
        cache = null
      }
    }
    if (cache) {
      req[key] = contents
      return
    }
    let contents
    try {
      contents = await Proxy.get({
        url: `${global.applicationServer}/template.html`
      })
    } catch (error) {
      contents = ''
    }
    if (contents && contents.indexOf('<html') > -1 && contents.indexOf('</html>') > -1) {
      global.packageJSON.dashboard.templateHTML = contents
      global.packageJSON.dashboard.templateHTMLPath = `${global.applicationServer}/template.html`
      cache = contents
      lastFetched = now
    }
  }
}
