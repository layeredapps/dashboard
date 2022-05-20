// Scans HTML documents for <script src="/xxx" /> tags and converts
// them to <script data-url={}>contents</script> tags for faster
// loading on the client-side.  Only relative URLs are inlined and
// script tags with "defer" are ignored.

const Proxy = require('../proxy.js')
const cache = {}
const lastFetched = {}
const nonexistent = {}

module.exports = {
  page: inlineLinkedJS,
  template: inlineLinkedJS
}

async function inlineLinkedJS (_, __, doc) {
  const scripts = doc.getElementsByTagName('script')
  if (scripts && scripts.length) {
    const now = new Date()
    for (const script of scripts) {
      if (!script.attr || !script.attr.src || !script.attr.src.startsWith('/')) {
        continue
      }
      if (script.attr.defer) {
        continue
      }
      const url = `${global.dashboardServer}${script.attr.src}`
      if (lastFetched[url]) {
        if (now.getTime() - lastFetched[url].getTime() > global.cacheApplicationServerFiles * 1000) {
          nonexistent[url] = null
          cache[url] = null
        }
      }
      if (nonexistent[url]) {
        continue
      }
      script.attr = {
        'data-src': script.attr.src
      }
      if (cache[url]) {
        script.child = [{
          node: 'text',
          text: cache[url]
        }]
        continue
      }
      try {
        const code = await Proxy.get({ url })
        if (!code || !code.length) {
          continue
        }
        cache[url] = code.toString()
        script.child = [{
          node: 'text',
          text: cache[url]
        }]
      } catch (error) {
      }
    }
  }
}
