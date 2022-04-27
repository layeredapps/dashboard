const Proxy = require('../proxy.js')
let cache
let lastFetched

module.exports = {
  before: async () => {
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
      return
    }
    let contents
    try {
      contents = await Proxy.get({
        url: `${global.applicationServer}/menu-account.html`
      })
      if (contents && contents.toString) {
        contents = contents.toString()
      }
    } catch (error) {
      contents = ''
    }
    if (contents) {
      if (lastFetched) {
        global.packageJSON.dashboard.menus.account.shift()
      }
      global.packageJSON.dashboard.menus.account.unshift(contents)
      cache = contents
      lastFetched = now
    }
  }
}
