const Proxy = require('../proxy.js')

module.exports = {
  page: inlineLinkedJS,
  template: inlineLinkedJS
}

async function inlineLinkedJS (_, __, doc) {
  const imgs = doc.getElementsByTagName('img')
  if (imgs && imgs.length) {
    for (const img of imgs) {
      if (img.attr && img.attr.src && img.attr.src.endsWith('.svg')) {
        try {
          const url = `${global.dashboardServer}${img.attr.src}`
          const svg = await Proxy.externalGET(url)
          if (!svg || !svg.length) {
            continue
          }
          img.attr.src = `data:image/svg+xml;utf8,${encodeURI(svg.toString())}`
        } catch (error) {
          continue
        }
      }
    }
  }
}
