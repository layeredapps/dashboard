// Scans HTML documents for <img src="/xxx.svg" /> tags and converts
// them to <img src="data:image/svg..."> tags for faster loading
// on the client-side.  Only relative URLs are inlined.

const Proxy = require('../proxy.js')
const cache = {}
const lastFetched = {}
const nonexistent = {}

module.exports = {
  page: inlineLinkedJS,
  template: inlineLinkedJS
}

async function inlineLinkedJS (_, __, doc) {
  const imgs = doc.getElementsByTagName('img')
  if (imgs && imgs.length) {
    const now = new Date()
    for (const img of imgs) {
      if (img.attr && img.attr.src && img.attr.src.endsWith('.svg')) {
        const url = `${global.dashboardServer}${img.attr.src}`
        if (lastFetched[url]) {
          if (now.getTime() - lastFetched[url].getTime() > global.cacheApplicationServerFiles * 1000) {
            nonexistent[url] = null
            cache[url] = null
          }
        }
        if (nonexistent[url]) {
          continue
        }
        if (cache[url]) {
          img.attr.src = `data:image/svg+xml;base64,${cache[url].toString('base64')}`
          continue
        }
        try {
          const svg = await Proxy.externalGET(url)
          if (!svg || !svg.length) {
            continue
          }
          img.attr.src = `data:image/svg+xml;base64,${svg.toString('base64')}`
          cache[url] = svg
        } catch (error) {
        }
      }
    }
  }
}
