const crypto = require('crypto')
const HTML = require('./html.js')
const zlib = require('zlib')
const eightDays = 8 * 24 * 60 * 60 * 1000
const eTagCache = {}
const mimeTypes = {
  js: 'text/javascript; charset=utf-8',
  css: 'text/css; charset=utf-8',
  txt: 'text/plain; charset=utf-8',
  html: 'text/html; charset=utf-8',
  jpg: 'image/jpeg',
  png: 'image/png',
  ico: 'image/x-icon',
  svg: 'image/svg+xml; charset=utf-8',
  eot: 'application/vnd.ms-fontobject',
  ttf: 'application/x-font-ttf',
  woff: 'application/font-woff',
  woff2: 'application/font-woff2'
}

module.exports = {
  end,
  redirect,
  redirectToSignIn,
  redirectToVerify,
  throw404,
  throw500,
  throw511,
  throwError,
  compress,
  wrapTemplateWithSrcDoc,
  wrapSrcDocWithTemplate,
  eTag,
  sri,
  mimeTypes
}

async function end (req, res, doc, blob) {
  res.statusCode = res.statusCode || 200
  if (!doc && !blob) {
    return res.end('')
  }
  const mimeType = mimeTypes[req.extension === 'jpeg' ? 'jpg' : req.extension] || mimeTypes.html
  res.setHeader('content-type', mimeType)
  if (blob) {
    const tag = eTagCache[req.urlPath] = eTagCache[req.urlPath] || req.eTag || eTag(blob)
    res.setHeader('expires', new Date(Date.now() + eightDays).toUTCString())
    res.setHeader('etag', tag)
    res.setHeader('vary', 'Accept-Encoding')
    if (mimeType !== mimeTypes.html) {
      return res.end(blob, 'binary')
    } else {
      return compress(req, res, blob)
    }
  }
  if (doc.substring) {
    doc = HTML.parse(doc)
  }
  if (!req.route || req.route.template !== false) {
    if (global.iframed) {
      const framedPage = await wrapTemplateWithSrcDoc(req, res, doc)
      return compress(req, res, framedPage)
    } else {
      const mergedPage = await wrapSrcDocWithTemplate(req, res, doc)
      return compress(req, res, mergedPage)
    }
  } else {
    const packageJSON = req.packageJSON || global.packageJSON
    if (packageJSON.dashboard.content && packageJSON.dashboard.content.length) {
      for (const contentHandler of packageJSON.dashboard.content) {
        if (contentHandler.page) {
          await contentHandler.page(req, res, doc)
        }
      }
    }
    if (req.contentSecurityPolicy || global.contentSecurityPolicy) {
      res.setHeader('content-security-policy', req.contentSecurityPolicy || global.contentSecurityPolicy)
    }
    return compress(req, res, '<!doctype html>' + doc.toString())
  }
}

async function redirect (req, res, url) {
  if (!url || !url.length || !url.startsWith('/')) {
    throw new Error('invalid-url')
  }
  res.setHeader('content-type', mimeTypes.html)
  const packageJSON = req.packageJSON || global.packageJSON
  const doc = HTML.parse(packageJSON.dashboard.redirectHTML.split('{url}').join(decodeURI(url)))
  if (packageJSON.dashboard.content && packageJSON.dashboard.content.length) {
    for (const contentHandler of packageJSON.dashboard.content) {
      if (contentHandler.page) {
        await contentHandler.page(req, res, doc)
      }
    }
  }
  res.ended = true
  return res.end('<!doctype html>' + doc.toString())
}

function throw404 (req, res) {
  return throwError(req, res, 404, 'Unknown URL or page')
}

function throw500 (req, res, error) {
  return throwError(req, res, 500, error || 'An error ocurred')
}

function throw511 (req, res) {
  return throwError(req, res, 511, 'Sign in required')
}

async function throwError (req, res, code, error) {
  const packageJSON = req.packageJSON || global.packageJSON
  const doc = HTML.parse(packageJSON.dashboard.errorHTML)
  const heading = doc.getElementById('error-title')
  heading.child = [{
    node: 'text',
    text: `Error ${code}, ${error}`
  }]
  heading.attr.code = code
  heading.attr.error = error.message
  res.statusCode = code || 500
  res.setHeader('content-type', mimeTypes.html)
  if (req.session) {
    if (global.iframed) {
      const combinedPages = await wrapTemplateWithSrcDoc(req, res, doc)
      const templateDoc = HTML.parse(combinedPages)
      return compress(req, res, templateDoc.toString())
    } else {
      const mergedPage = await wrapSrcDocWithTemplate(req, res, doc)
      return compress(req, res, mergedPage.toString())
    }
  }
  return compress(req, res, doc.toString())
}

function compress (req, res, data) {
  if (!req.headers) {
    return res.end(data)
  }
  const acceptEncoding = req.headers['Accept-Encoding'] || ''
  if (!acceptEncoding) {
    return res.end(data)
  }
  if (acceptEncoding.match(/\bdeflate\b/)) {
    return zlib.deflate(data, (error, result) => {
      if (error) {
        throw500(req, res)
      }
      res.setHeader('content-encoding', 'deflate')
      return res.end(result)
    })
  } else if (acceptEncoding.match(/\bgzip\b/)) {
    return zlib.gzip(data, (error, result) => {
      if (error) {
        throw500(req, res)
      }
      res.setHeader('content-encoding', 'gzip')
      return res.end(result)
    })
  }
  return res.end(data)
}

function eTag (buffer) {
  if (buffer.length === 0) {
    return '"0-2jmj7l5rSw0yVb/vlWAYkK/YBwk"'
  }
  const hash = crypto.createHash('sha1').update(buffer, 'utf-8').digest('base64').replace(/=+$/, '')
  return '"' + buffer.length.toString(16) + '-' + hash + '"'
}

function sri (buffer) {
  const hash = crypto.createHash('sha384').update(buffer, 'binary').digest('base64').replace(/=+$/, '')
  return 'sha384-' + hash
}

async function wrapSrcDocWithTemplate (req, res, doc) {
  const packageJSON = req.packageJSON || global.packageJSON
  const templateDoc = HTML.parse(packageJSON.dashboard.templateHTML)
  if (!templateDoc) {
    throw new Error('invalid-template')
  }
  // template title
  let newTitle = packageJSON.dashboard.title
  if (newTitle && newTitle.length && newTitle.indexOf(' ') > -1) {
    newTitle = newTitle.split(' ').join('&nbsp;')
  }
  const headingLink = {
    object: 'link',
    href: global.dashboardServer || '/',
    text: newTitle
  }
  HTML.renderTemplate(templateDoc, headingLink, 'heading-link', 'heading')
  // icon theming
  const metaTags = doc.getElementsByTagName('meta')
  if (packageJSON.dashboard.tileColor) {
    for (const tag of metaTags) {
      if (tag.attr && tag.attr.name === 'msapplication-TileColor') {
        tag.attr.contnet = packageJSON.dashboard.tileColor
      }
    }
  }
  if (packageJSON.dashboard.themeColor) {
    for (const tag of metaTags) {
      if (tag.attr && tag.attr.name === 'theme-color') {
        tag.attr.contnet = packageJSON.dashboard.themeColor
      }
    }
  }
  // template navigation
  const navbarTemplate = doc.getElementById('navbar')
  const navigation = templateDoc.getElementById('navigation')
  if (navbarTemplate && navbarTemplate.child && navbarTemplate.child.length) {
    if (navbarTemplate.child[0].node === 'text') {
      navigation.child = HTML.parse('<div>' + navbarTemplate.child[0].text + '</div>').child
    } else {
      navigation.child = navbarTemplate.child
    }
    const spillage = templateDoc.getElementById('spillage')
    const children = HTML.parse(navigation.toString()).child
    const links = []
    if (children && children.length) {
      for (const child of children) {
        if (child.tag === 'a') {
          child.attr.class = 'spillage-link'
          links.push(child)
          if (child.child && child.child.length > 1) {
            for (const element of child.child) {
              if (element.tag !== 'text') {
                child.child.splice(child.child.indexOf(element), 1)
              }
            }
          }
        }
      }
    }
    spillage.child = links
  } else {
    navigation.setAttribute('style', 'display: none')
  }
  // template menus
  const accountMenuContainer = templateDoc.getElementById('account-menu-container')
  const administratorMenuContainer = templateDoc.getElementById('administrator-menu-container')
  if (!req.account) {
    accountMenuContainer.parentNode.removeChild(accountMenuContainer)
    administratorMenuContainer.removeChild(administratorMenuContainer)
  } else {
    const prependHTML = packageJSON.dashboard.menuAccountHTML || ''
    if (packageJSON.dashboard.menus &&
        packageJSON.dashboard.menus.account &&
        packageJSON.dashboard.menus.account.length) {
      const accountMenu = templateDoc.getElementById('account-menu')
      accountMenu.child = HTML.parse('<div>' + prependHTML + packageJSON.dashboard.menus.account.join('\n') + '</div>').child
    } else {
      accountMenuContainer.setAttribute('style', 'display: none')
    }
    if (!req.account.administrator) {
      administratorMenuContainer.setAttribute('style', 'display: none')
    } else {
      const prependHTML = packageJSON.dashboard.menuAdministratorHTML || ''
      if (packageJSON.dashboard.menus &&
          packageJSON.dashboard.menus.administrator &&
          packageJSON.dashboard.menus.administrator.length) {
        const administratorMenu = templateDoc.getElementById('administrator-menu')
        administratorMenu.child = HTML.parse('<div>' + prependHTML + packageJSON.dashboard.menus.administrator.join('\n') + '</div>').child
      } else {
        administratorMenuContainer.setAttribute('style', 'display: none')
      }
    }
  }
  // content handlers
  if (packageJSON.dashboard.content && packageJSON.dashboard.content.length) {
    for (const contentHandler of packageJSON.dashboard.content) {
      if (contentHandler.page) {
        await contentHandler.page(req, res, doc)
      }
      if (contentHandler.template) {
        await contentHandler.template(req, res, templateDoc)
      }
    }
  }
  highlightCurrentPage(req.urlPath, templateDoc)
  // merge head scripts and css
  const templateScripts = templateDoc.getElementsByTagName('script').reverse()
  const templateLinks = templateDoc.getElementsByTagName('link').reverse()
  const templateStyles = templateDoc.getElementsByTagName('style').reverse()
  const head = doc.getElementsByTagName('head')[0]
  for (const script of templateScripts) {
    head.child.unshift(script)
  }
  for (const link of templateLinks) {
    head.child.unshift(link)
  }
  for (const style of templateStyles) {
    head.child.unshift(style)
  }
  // merge body
  const container = templateDoc.getElementById('template-header')
  const pageBody = doc.getElementsByTagName('body')[0]
  pageBody.child.unshift(container)
  return '<!doctype html>' + doc.toString()
}

async function wrapTemplateWithSrcDoc (req, res, doc) {
  const packageJSON = req.packageJSON || global.packageJSON
  const templateDoc = HTML.parse(packageJSON.dashboard.templateHTML)
  if (!templateDoc) {
    throw new Error()
  }
  const headTemplate = doc.getElementById('head')
  if (headTemplate && headTemplate.child && headTemplate.child.length) {
    const head = templateDoc.getElementsByTagName('head')[0]
    if (head) {
      head.child = head.child || []
      head.child = head.child.concat(headTemplate.child)
    }
  }
  const pageTemplate = templateDoc.getElementById('page')
  if (pageTemplate && pageTemplate.child && pageTemplate.child.length) {
    const head = doc.getElementsByTagName('head')[0]
    if (head) {
      head.child = head.child || []
      head.child = head.child.concat(pageTemplate.child)
    }
  }
  const navbarTemplate = doc.getElementById('navbar')
  const navigation = templateDoc.getElementById('navigation')
  if (navbarTemplate && navbarTemplate.child && navbarTemplate.child.length) {
    if (navbarTemplate.child[0].node === 'text') {
      navigation.child = HTML.parse('<div>' + navbarTemplate.child[0].text + '</div>').child
    } else {
      navigation.child = navbarTemplate.child
    }
    const spillage = templateDoc.getElementById('spillage')
    const children = HTML.parse(navigation.toString()).child
    const links = []
    if (children && children.length) {
      for (const child of children) {
        if (child.tag === 'a') {
          child.attr.class = 'spillage-link'
          links.push(child)
          if (child.child && child.child.length > 1) {
            for (const element of child.child) {
              if (element.tag !== 'text') {
                child.child.splice(child.child.indexOf(element), 1)
              }
            }
          }
        }
      }
    }
    spillage.child = links
  } else {
    navigation.setAttribute('style', 'display: none')
  }
  const pageTitles = doc.getElementsByTagName('title')
  const templateTitles = templateDoc.getElementsByTagName('title')
  if (pageTitles && pageTitles.length && templateTitles && templateTitles.length) {
    templateTitles[0].child = pageTitles[0].child
  }
  let newTitle = packageJSON.dashboard.title
  if (newTitle && newTitle.length && newTitle.indexOf(' ') > -1) {
    newTitle = newTitle.split(' ').join('&nbsp;')
  }
  const headingLink = {
    object: 'link',
    href: global.dashboardServer || '/',
    text: newTitle
  }
  HTML.renderTemplate(templateDoc, headingLink, 'heading-link', 'heading')
  const accountMenuContainer = templateDoc.getElementById('account-menu-container')
  const administratorMenuContainer = templateDoc.getElementById('administrator-menu-container')
  if (!req.account) {
    accountMenuContainer.parentNode.removeChild(accountMenuContainer)
    administratorMenuContainer.removeChild(administratorMenuContainer)
  } else {
    if (packageJSON.dashboard.menus &&
        packageJSON.dashboard.menus.account &&
        packageJSON.dashboard.menus.account.length) {
      const accountMenu = templateDoc.getElementById('account-menu')
      accountMenu.child = HTML.parse('<div>' + packageJSON.dashboard.menus.account.join('\n') + '</div>').child
    } else {
      accountMenuContainer.setAttribute('style', 'display: none')
    }
    if (!req.account.administrator) {
      administratorMenuContainer.setAttribute('style', 'display: none')
    } else {
      if (packageJSON.dashboard.menus &&
          packageJSON.dashboard.menus.administrator &&
          packageJSON.dashboard.menus.administrator.length) {
        const administratorMenu = templateDoc.getElementById('administrator-menu')
        administratorMenu.child = HTML.parse('<div>' + packageJSON.dashboard.menus.administrator.join('\n') + '</div>').child
      } else {
        administratorMenuContainer.setAttribute('style', 'display: none')
      }
    }
  }
  if (packageJSON.dashboard.content && packageJSON.dashboard.content.length) {
    for (const contentHandler of packageJSON.dashboard.content) {
      if (contentHandler.page) {
        await contentHandler.page(req, res, doc)
      }
      if (contentHandler.template) {
        await contentHandler.template(req, res, templateDoc)
      }
    }
  }
  highlightCurrentPage(req.urlPath, templateDoc)
  const iframe = templateDoc.getElementById('application-iframe')
  iframe.attr.srcdoc = doc.toString().split("'").join('&#39;').split('"').join("'")
  if (pageTitles && pageTitles.length && pageTitles[0].child && pageTitles[0].child.length) {
    iframe.attr.title = pageTitles[0].child[0].text
  }
  return '<!doctype html>' + templateDoc.toString()
}

function highlightCurrentPage (urlPath, doc) {
  const groups = doc.getElementsByTagName('menu').concat(doc.getElementsByTagName('nav'))
  const pageURL = urlPath.split('/').pop()
  for (const group of groups) {
    const links = group.getElementsByTagName('a')
    for (const link of links) {
      if (!link.attr || !link.attr.href) {
        continue
      }
      const linkPath = link.attr.href.split('?')[0]
      if (linkPath === urlPath || linkPath === pageURL) {
        if (link.attr.class && link.attr.class.indexOf('navigation-link') > -1) {
          link.classList.add('current-page')
        }
      }
    }
  }
}

function redirectToSignIn (req, res) {
  let returnURL = req.urlPath
  if (req.query) {
    const variables = []
    for (const field in req.query) {
      if (field !== 'return-url') {
        const value = encodeURI(req.query[field])
        variables.push(`${field}=${value}`)
      }
    }
    if (variables.length) {
      returnURL = `${req.urlPath}%3F${variables.join('%26')}`
    }
  }
  return redirect(req, res, `/account/signin?return-url=${returnURL}`)
}

function redirectToVerify (req, res) {
  let returnURL = req.urlPath
  if (req.query) {
    const variables = []
    for (const field in req.query) {
      if (field !== 'return-url') {
        const value = encodeURI(req.query[field])
        variables.push(`${field}=${value}`)
      }
    }
    if (variables.length) {
      returnURL = `${req.urlPath}%3F${variables.join('%26')}`
    }
  }
  return redirect(req, res, `/account/verify?return-url=${returnURL}`)
}
