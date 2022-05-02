const fs = require('fs')
const path = require('path')
const Validate = require('./validate.js')

module.exports = {
  generate,
  scanFiles,
  mergeRoutes,
  loadRoute,
  readHTMLAttributes
}

function generate () {
  const routes = {}
  mergeRoutes(routes, '@layeredapps/dashboard')
  for (const moduleName of global.packageJSON.dashboard.moduleNames) {
    mergeRoutes(routes, moduleName)
  }
  mergeRoutes(routes)
  return routes
}

function mergeRoutes (routes, moduleName) {
  const fileList = []
  if (!moduleName) {
    const rootPath = path.join(global.applicationPath, '/src/www')
    if (fs.existsSync(rootPath)) {
      scanFiles(rootPath, fileList)
    }
  } else {
    let modulePath
    try {
      modulePath = require.resolve(moduleName)
    } catch (error) {
    }
    if (modulePath) {
      scanFiles(modulePath.replace('index.js', '/src/www'), fileList)
    }
  }
  for (const fileName of fileList) {
    let urlKey = fileName.substring(fileName.indexOf('/src/www') + '/src/www'.length)
    urlKey = urlKey.substring(0, urlKey.lastIndexOf('.'))
    if (urlKey.endsWith('/index')) {
      urlKey = urlKey.substring(0, urlKey.lastIndexOf('/index'))
      if (!urlKey) {
        urlKey = '/'
      }
    }
    const route = loadRoute(fileName)
    if (route) {
      routes[urlKey] = route
    }
  }
}

function scanFiles (pathName, fileList) {
  const folderContents = fs.readdirSync(pathName)
  fileList = fileList || []
  for (const filePath of folderContents) {
    if (filePath === 'public') {
      continue
    }
    const fullPath = path.join(pathName, filePath)
    const stat = fs.statSync(fullPath)
    if (stat.isDirectory()) {
      scanFiles(fullPath, fileList)
      continue
    }
    if (!filePath.endsWith('.html') && !filePath.endsWith('.js')) {
      continue
    }
    if (filePath.indexOf('navbar') !== -1 || filePath.endsWith('.test.js')) {
      continue
    }
    if (filePath.endsWith('.html') && fs.existsSync(fullPath.replace('.html', '.js'))) {
      continue
    }
    if (global.applicationServer && (filePath.endsWith('/src/www/index.html') || filePath.endsWith('/src/www/home.html'))) {
      continue
    }
    fileList.push(fullPath)
  }
}

function loadRoute (fileName) {
  const baseFilePath = fileName.substring(0, fileName.lastIndexOf('.'))
  const jsFilePathFull = baseFilePath + '.js'
  const jsFileExists = fs.existsSync(jsFilePathFull)
  const api = jsFileExists ? require(jsFilePathFull) : 'static-page'
  if (api !== 'static-page' && !api.get && !api.post && !api.patch && !api.delete && !api.put) {
    return null
  }
  const route = {
    auth: api.auth || false,
    api
  }
  if (jsFileExists) {
    route.jsFileExists = jsFileExists
    route.jsFilePathFull = jsFilePathFull
    route.jsFilePath = jsFilePathFull.substring(global.applicationPath.length)
  }
  if (process.env.HOT_RELOAD) {
    route.reload = () => {
      if (route.jsFileExists) {
        delete require.cache[require.resolve(route.jsFilePathFull)]
        route.api = require(route.jsFilePathFull)
      }
      if (route.htmlFileExists) {
        route.html = fs.readFileSync(route.htmlFilePathFull).toString()
      }
    }
  }
  const apiOnly = baseFilePath.indexOf('/api/') > -1
  if (apiOnly) {
    for (const method of ['POST', 'PATCH', 'PUT', 'DELETE']) {
      if (!route[method]) {
        continue
      }
      const originalHandler = route.api[method]
      const xssPreCheck = async (req, res) => {
        if (req.body) {
          Validate.requestBodyXSS(req.body)
        }
        return originalHandler(req, res)
      }
      route.api[method] = xssPreCheck
    }
    return route
  }
  if (route.api.post) {
    const postHandler = route.api.post
    const xssPreCheck = async (req, res) => {
      try {
        Validate.requestBodyXSS(req.body)
      } catch (error) {
        return route.api.get(req, res, error.message)
      }
      return postHandler(req, res)
    }
    route.api.post = xssPreCheck
  }
  route.htmlFilePathFull = baseFilePath + '.html'
  route.htmlFilePath = route.htmlFilePathFull.substring(global.applicationPath.length)
  route.htmlFileExists = fs.existsSync(route.htmlFilePathFull)
  route.html = route.htmlFileExists ? fs.readFileSync(route.htmlFilePathFull).toString() : null
  route.auth = api && api.auth === false ? api.auth : true
  if (!apiOnly && route.html) {
    const settings = readHTMLAttributes(route.html)
    route.template = settings.template
    if (settings.auth !== false) {
      route.auth = true
    } else {
      route.auth = false
    }
    route.navbar = settings.navbar
  }
  return route
}

function readHTMLAttributes (html) {
  let htmlTag = html.substring(html.indexOf('<html'))
  htmlTag = htmlTag.substring(0, htmlTag.indexOf('>')).toLowerCase()
  const template = htmlTag.indexOf('data-template="false"') === -1 && htmlTag.indexOf("data-template='false'") === -1
  const auth = htmlTag.indexOf('data-auth="false"') === -1 && htmlTag.indexOf("data-auth='false'") === -1
  const navbar = htmlTag.indexOf('data-navbar=') > -1
  return { template, auth, navbar }
}
