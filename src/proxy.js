const http = require('http')
const https = require('https')
const HTML = require('./html.js')
const Log = require('./log.js')('proxy')
const Response = require('./response.js')
const util = require('util')

module.exports = {
  pass,
  get: util.promisify(get),
  externalPOST: util.promisify(externalPOST),
  externalGET: util.promisify(externalGET)
}

async function pass (req, res) {
  const parsedURL = new URL(`${req.applicationServer || global.applicationServer}${req.url}`)
  let host = parsedURL.hostname
  if (host.indexOf(':') > -1) {
    host = host.substring(0, host.indexOf(':'))
  }
  const port = parsedURL.port
  const path = `${parsedURL.pathname}${parsedURL.search || ''}`
  const requestOptions = {
    host,
    path,
    method: req.method,
    port,
    headers: {
      referer: `${global.dashboardServer}${req.url}`,
      'x-dashboard-server': global.dashboardServer,
      'x-application-server-token': req.applicationServerToken || global.applicationServerToken
    }
  }
  if (req.method === 'GET' && req.headers && req.headers['if-none-match']) {
    requestOptions.headers['if-none-match'] = req.headers['if-none-match']
  }
  if (req.account) {
    requestOptions.headers['x-accountid'] = req.account.accountid
    requestOptions.headers['x-sessionid'] = req.session.sessionid
  }
  if (global.packageJSON.dashboard.proxy && global.packageJSON.dashboard.proxy.length) {
    for (const handler of global.packageJSON.dashboard.proxy) {
      await handler(req, requestOptions)
    }
  }
  if (req.body && req.bodyRaw) {
    requestOptions.headers['content-length'] = req.headers['content-length'] || req.bodyRaw.length
    requestOptions.headers['content-type'] = req.headers['content-type'] || 'application/x-www-form-urlencoded'
  } else if (req.body) {
    const boundary = '--------------------------' + (Math.random() + '').split('.')[1]
    const body = []
    for (const field in req.body) {
      let nextPostData = `--${boundary}\r\n`
      nextPostData += `content-disposition: form-data; name="${field}"\r\n\r\n`
      nextPostData += `${req.body[field]}\r\n`
      body.push(nextPostData)
    }
    for (const field in req.uploads) {
      let nextPostData = `--${boundary}\r\n`
      nextPostData += `content-disposition: form-data; name="${field}"; filename="${req.uploads[field].name}"\r\n`
      nextPostData += `content-type: ${req.uploads[field].type}\r\n\r\n`
      nextPostData += req.uploads[field].buffer.toString('binary')
      nextPostData += '\r\n'
      body.push(nextPostData)
    }
    body.push(`--${boundary}--`)
    req.body = req.bodyRaw = Buffer.from(body.join(''), 'binary')
    requestOptions.headers['content-length'] = Buffer.byteLength(req.body)
    requestOptions.headers['content-type'] = 'multipart/form-data; boundary=' + boundary
  }
  const protocol = (req.applicationServerToken || global.applicationServer).startsWith('https') ? https : http
  const proxyRequest = protocol.request(requestOptions, (proxyResponse) => {
    const bodyParts = []
    proxyResponse.on('data', (chunk) => {
      bodyParts.push(chunk)
    })
    proxyResponse.on('end', () => {
      let body = bodyParts.length ? Buffer.concat(bodyParts) : undefined
      switch (proxyResponse.statusCode) {
        case 200:
          if (proxyResponse.headers['content-type'] && proxyResponse.headers['content-type'].indexOf('text/html') === 0) {
            body = body.toString()
            const htmlTagIndex = body.indexOf('<html')
            if (htmlTagIndex > -1) {
              let htmlTag = body.substring(htmlTagIndex)
              htmlTag = htmlTag.substring(0, htmlTag.indexOf('>'))
              if (htmlTag.indexOf(' data-template="false"') > -1 ||
                htmlTag.indexOf(" data-template='false'") > -1 ||
                htmlTag.indexOf(' data-template=false') > -1) {
                return res.end(body)
              }
              const doc = HTML.parse(body)
              return Response.end(req, res, doc)
            }
          }
          return Response.end(req, res, null, body)
        case 302:
          return Response.redirect(req, res, proxyResponse.headers.location)
        case 304:
          res.statusCode = 304
          return res.end()
        case 404:
          if (req.urlPath.startsWith('/api/')) {
            res.setHeader('content-type', 'application/json')
            return res.end('{ "object": "error", "message": "Invalid content was returned from the application server" }')
          }
          return Response.throw404(req, res)
        case 511:
          if (req.urlPath.startsWith('/api/')) {
            res.setHeader('content-type', 'application/json')
            return res.end('{ "object": "error", "message": "Invalid content was returned from the application server" }')
          }
          return Response.redirectToSignIn(req, res)
        case 500:
        default:
          if (req.urlPath.startsWith('/api/')) {
            res.setHeader('content-type', 'application/json')
            return res.end('{ object": "error", "message": "Invalid content was returned from the application server" }')
          }
          return Response.throw500(req, res)
      }
    })
  })
  if (req.bodyRaw) {
    proxyRequest.write(req.bodyRaw)
  } else if (req.body) {
    proxyRequest.write(req.body)
  }
  proxyRequest.on('error', (error) => {
    Log.error('proxy error', requestOptions, error)
    return Response.throw500(req, res)
  })
  proxyRequest.end()
  return requestOptions
}

async function get (req, callback) {
  const parsedURL = new URL(req.url.startsWith('/') ? `${global.applicationServer}${req.url}` : req.url)
  let host = parsedURL.hostname
  if (host.indexOf(':') > -1) {
    host = host.substring(0, host.indexOf(':'))
  }
  const port = parsedURL.port
  const path = `${parsedURL.pathname}${parsedURL.search || ''}`
  const requestOptions = {
    host,
    path,
    port,
    method: 'GET',
    headers: {
      referer: `${global.dashboardServer}${req.url}`,
      'x-dashboard-server': global.dashboardServer,
      'x-application-server-token': req.applicationServerToken || global.applicationServerToken
    }
  }
  if (req.account) {
    requestOptions.headers['x-accountid'] = req.account.accountid
    requestOptions.headers['x-sessionid'] = req.session.sessionid
  }
  if (global.packageJSON.dashboard.proxy && global.packageJSON.dashboard.proxy.length) {
    for (const handler of global.packageJSON.dashboard.proxy) {
      await handler(req, requestOptions)
    }
  }
  const protocol = global.applicationServer.startsWith('http://') ? 'http' : 'https'
  const proxyRequest = require(protocol).request(requestOptions, (proxyResponse) => {
    const bodyParts = []
    proxyResponse.on('data', (chunk) => {
      bodyParts.push(chunk)
    })
    return proxyResponse.on('end', () => {
      return callback(null, bodyParts.length ? Buffer.concat(bodyParts) : undefined)
    })
  })
  proxyRequest.on('error', (error) => {
    Log.error('proxy error', requestOptions, error)
    return callback(error)
  })
  return proxyRequest.end()
}

async function externalPOST (url, headers, body, callback) {
  const parsedURL = new URL(url)
  let host = parsedURL.hostname
  if (host.indexOf(':') > -1) {
    host = host.substring(0, host.indexOf(':'))
  }
  const port = parsedURL.port
  const path = `${parsedURL.pathname}${parsedURL.search || ''}`
  const requestOptions = {
    host,
    path,
    port,
    method: 'POST',
    headers: headers || {}
  }
  const bodyRawFields = []
  for (const field in body) {
    bodyRawFields.push(`${field}=${body[field]}`)
  }
  const bodyRaw = bodyRawFields.join('&')
  if (bodyRaw.length) {
    requestOptions.headers['content-length'] = bodyRaw.length
    requestOptions.headers['content-type'] = 'application/x-www-form-urlencoded'
  }
  const protocol = url.startsWith('http://') ? 'http' : 'https'
  const proxyRequest = require(protocol).request(requestOptions, (proxyResponse) => {
    const bodyParts = []
    proxyResponse.on('data', (chunk) => {
      bodyParts.push(chunk)
    })
    return proxyResponse.on('end', () => {
      return callback(null, bodyParts.length ? Buffer.concat(bodyParts) : undefined)
    })
  })
  proxyRequest.on('error', (error) => {
    Log.error('proxy error', requestOptions, error)
    return callback(error)
  })
  proxyRequest.write(bodyRaw)
  return proxyRequest.end()
}

async function externalGET (url, headers, callback) {
  if (arguments.length === 2) {
    callback = arguments[1]
    headers = undefined
  }
  const parsedURL = new URL(url)
  let host = parsedURL.hostname
  if (host.indexOf(':') > -1) {
    host = host.substring(0, host.indexOf(':'))
  }
  const port = parsedURL.port
  const path = `${parsedURL.pathname}${parsedURL.search || ''}`
  const requestOptions = {
    host,
    path,
    port,
    method: 'GET',
    headers: headers || {}
  }
  const protocol = url.startsWith('http://') ? 'http' : 'https'
  const proxyRequest = require(protocol).request(requestOptions, (proxyResponse) => {
    const bodyParts = []
    proxyResponse.on('data', (chunk) => {
      bodyParts.push(chunk)
    })
    return proxyResponse.on('end', () => {
      return callback(null, bodyParts.length ? Buffer.concat(bodyParts) : undefined)
    })
  })
  proxyRequest.on('error', (error) => {
    Log.error('proxy error', requestOptions, error)
    return callback(error)
  })
  return proxyRequest.end()
}
