// Scans HTML documents for <link rel="stylesheet" href="/xxx" /> tags
// and converts them to <style data-url={}>contents</style> tags for
// faster loading on the client-side.  Only relative URLs are inlined.

const Proxy = require('../proxy.js')
const cache = {}
const lastFetched = {}
const nonexistent = {}

module.exports = {
  page: inlineLinkedCSS,
  template: inlineLinkedCSS
}

async function inlineLinkedCSS (_, __, doc) {
  const links = doc.getElementsByTagName('link')
  if (links && links.length) {
    const now = new Date()
    for (const link of links) {
      if (link.attr && link.attr.href && link.attr.rel === 'stylesheet') {
        const url = link.attr.href.indexOf('/') === 0 ? `${global.dashboardServer}${link.attr.href}` : link.attr.href
        if (lastFetched[url]) {
          if (global.hotReload || now.getTime() - lastFetched[url].getTime() > global.cacheApplicationServerFiles * 1000) {
            nonexistent[url] = null
            cache[url] = null
          }
        }
        if (nonexistent[url]) {
          continue
        }
        link.tag = 'style'
        link.attr = {
          'data-url': url
        }
        if (cache[url]) {
          link.child = [{
            node: 'text',
            text: cache[url]
          }]
          continue
        }
        try {
          const style = await Proxy.externalGET(url)
          if (!style || !style.length) {
            continue
          }
          cache[url] = style.toString()
          lastFetched[url] = now
          link.child = [{
            node: 'text',
            text: cache[url]
          }]
        } catch (error) {
        }
      }
    }
  }
}
