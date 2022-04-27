const Proxy = require('../proxy.js')
let cache
let lastFetched

module.exports = {
  before: fetchApplicationServerAdministratorMenuHTML
}

async function fetchApplicationServerAdministratorMenuHTML () {
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
      url: `${global.applicationServer}/menu-administrator.html`
    })
    if (contents && contents.toString) {
      contents = contents.toString()
    }
  } catch (error) {
    contents = ''
  }
  if (contents) {
    if (lastFetched) {
      global.packageJSON.dashboard.menus.administrator.shift()
    }
    global.packageJSON.dashboard.menus.administrator.unshift(contents)
    cache = contents
    lastFetched = now
  }
}
