const Proxy = require('../proxy.js')
let cache
let lastFetched

module.exports = {
  before: fetchApplicationServerTemplateHTML
}

async function fetchApplicationServerTemplateHTML () {
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
      url: `${global.applicationServer}/template.html`
    })
    if (contents && contents.toString) {
      contents = contents.toString()
    }
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
