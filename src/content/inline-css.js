const Proxy = require('../proxy.js')

module.exports = {
  page: inlineLinkedCSS,
  template: inlineLinkedCSS
}

async function inlineLinkedCSS (_, __, doc) {
  const links = doc.getElementsByTagName('link')
  if (links && links.length) {
    const chunks = []
    for (const link of links) {
      if (link.attr && link.attr.href && link.attr.rel === 'stylesheet') {
        link.parentNode.removeChild(link)
        try {
          const url = link.attr.href.indexOf('/') === 0 ? `${global.dashboardServer}${link.attr.href}` : link.attr.href
          const style = await Proxy.externalGET(url)
          if (!style || !style.length) {
            continue
          }
          chunks.push(style)
        } catch (error) {
          continue
        }
      }
    }
    const style = doc.createElement('style')
    style.child = [{
      node: 'text',
      text: Buffer.concat(chunks).toString()
    }]
    doc.getElementsByTagName('head')[0].child.push(style)
  }
}
