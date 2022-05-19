const Proxy = require('../proxy.js')

module.exports = {
  page: inlineLinkedJS,
  template: inlineLinkedJS
}

async function inlineLinkedJS (_, __, doc) {
  const scripts = doc.getElementsByTagName('script')
  if (scripts && scripts.length) {
    const chunks = []
    for (const script of scripts) {
      if (script.attr && script.attr.src && script.attr.src.startsWith('/')) {
        script.parentNode.removeChild(script)
        try {
          const url = `${global.dashboardServer}${script.attr.src}`
          const code = await Proxy.externalGET(url)
          if (!code || !code.length) {
            continue
          }
          chunks.push(code)
        } catch (error) {
          continue
        }
      }
    }
    const script = doc.createElement('script')
    script.child = [{
      node: 'text',
      text: Buffer.concat(chunks).toString()
    }]
    doc.getElementsByTagName('head')[0].child.push(script)
  }
}
