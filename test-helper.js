/* eslint-env mocha */
global.applicationPath = global.applicationPath || __dirname
global.appid = global.appid || 'tests'
global.testConfiguration = global.testConfiguration || {}
global.language = global.language || 'en'

const defaultConfigurationValues = {
  domain: 'localhost',
  applicationServer: null,
  applicationServerToken: null,
  homePath: null,
  language: 'en',
  enableLanguagePreference: false,
  testModuleJSON: null,
  requireProfile: false,
  disableMetrics: false,
  disableRegistration: false,
  userProfileFields: ['full-name', 'contact-email'],
  minimumUsernameLength: 1,
  maximumUsernameLength: 100,
  minimumPasswordLength: 1,
  maximumPasswordLength: 100,
  minimumResetCodeLength: 1,
  maximumResetCodeLength: 100,
  minimumProfileFullNameLength: 1,
  maximumProfileFullNameLength: 100,
  minimumProfileDisplayNameLength: 1,
  maximumProfileDisplayNameLength: 100,
  minimumProfileCompanyNameLength: 1,
  maximumProfileCompanyNameLength: 100,
  deleteDelay: 7,
  pageSize: 2,
  bcryptWorkloadFactor: 4,
  sessionVerificationDelay: 14400
}
for (const property in defaultConfigurationValues) {
  global.testConfiguration[property] = global.testConfiguration[property] || defaultConfigurationValues[property]
}

const dashboard = require('./index.js')
const { faker } = require('@faker-js/faker')
const fs = require('fs')
const helperRoutes = require('./test-helper-routes.js')
const http = require('http')
const https = require('https')
const Log = require('./src/log.js')('test-helper-dashboard')
const packageJSON = require('./src/package-json.js')
const path = require('path')
const querystring = require('querystring')
const TestHelperPuppeteer = require('./test-helper-puppeteer.js')
const util = require('util')
const mimeTypes = {
  js: 'text/javascript;',
  css: 'text/css',
  txt: 'text/plain',
  html: 'text/html',
  jpg: 'image/jpeg',
  png: 'image/png',
  ico: 'image/x-icon',
  svg: 'image/svg+xml'
}

const generateResponse = process.env.GENERATE_RESPONSE === 'true'
let startedServer = false

async function setupBefore () {
  if (startedServer) {
    return
  }
  global.testConfiguration.port = global.port || process.env.PORT || 9000
  let dashboardServer = global.dashboardServer || process.env.DASHBOARD_SERVER || 'http://localhost:9000'
  if (dashboardServer.lastIndexOf(':') > dashboardServer.indexOf(':')) {
    dashboardServer = dashboardServer.substring(0, dashboardServer.lastIndexOf(':'))
  }
  global.testConfiguration.dashboardServer = `${dashboardServer}:${global.testConfiguration.port}`
  Log.info('starting server')
  while (true) {
    global.port = global.testConfiguration.port
    try {
      await dashboard.start()
      startedServer = true
      break
    } catch (error) {
      Log.error('error starting server', error)
      global.testConfiguration.port++
      global.testConfiguration.dashboardServer = `${dashboardServer}:${global.testConfiguration.port}`
    }
  }
}

async function setupBeforeEach () {
  Log.info('setupBeforeEach')
  global.packageJSON = packageJSON.merge()
  global.packageJSON.dashboard = global.packageJSON.dashboard || {}
  // these are added under normal starting-circumstances by `index.js`
  global.packageJSON.dashboard.serverFilePaths.push(require.resolve('./src/server/check-csrf-token.js'))
  global.packageJSON.dashboard.server.push(require('./src/server/check-csrf-token.js'))
  global.packageJSON.dashboard.contentFilePaths.push(require.resolve('./src/content/insert-csrf-token.js'))
  global.packageJSON.dashboard.content.push(require('./src/content/insert-csrf-token.js'))
  global.packageJSON.dashboard.serverFilePaths.push(require.resolve('./src/server/check-xss-injection.js'))
  global.packageJSON.dashboard.server.push(require('./src/server/check-xss-injection.js'))
  global.packageJSON.dashboard.contentFilePaths.push(require.resolve('./src/content/set-form-return-url.js'))
  global.packageJSON.dashboard.content.push(require('./src/content/set-form-return-url.js'))
  // allow api access so the tests can perform HTTP requests against the API
  global.packageJSON.dashboard.serverFilePaths = global.packageJSON.dashboard.serverFilePaths || []
  global.packageJSON.dashboard.serverFilePaths.push(require.resolve('./src/server/allow-api-access'))
  global.packageJSON.dashboard.server = global.packageJSON.dashboard.server || []
  global.packageJSON.dashboard.server.push(require('./src/server/allow-api-access'))
  // disable form validation (eg <input required />) so error messages can be returned by server
  global.packageJSON.dashboard.contentFilePaths = global.packageJSON.dashboard.contentFilePaths || []
  global.packageJSON.dashboard.contentFilePaths.push(require.resolve('./src/content/set-form-novalidate.js'))
  global.packageJSON.dashboard.content = global.packageJSON.dashboard.content || []
  global.packageJSON.dashboard.content.push(require('./src/content/set-form-novalidate.js'))
  // add test helper routes
  global.sitemap['/api/require-verification'] = helperRoutes.requireVerification
  // reset configuration
  global.testConfiguration.testNumber = Math.floor(new Date().getTime() / 1000)
  global.testConfiguration.appid = `tests_${global.testConfiguration.testNumber}`
  for (const property in global.testConfiguration) {
    global[property] = global.testConfiguration[property]
  }
  // gc disposal if node was started with `node --expose-gc`
  if (global.gc) {
    global.gc()
  }
}

before(setupBefore)
before(flushAllStorage)
beforeEach(setupBeforeEach)
afterEach(flushAllStorage)

after((callback) => {
  Log.info('after')
  dashboard.stop()
  global.testEnded = true
  return callback()
})

after(async () => {
  Log.info('after')
  await TestHelperPuppeteer.close()
})

const wait = util.promisify(function (amount, callback) {
  return setTimeout(callback, amount || 1)
})

module.exports = {
  completeVerification,
  createAdministrator,
  createMultiPart,
  createOwner,
  createProfile,
  createRequest,
  createSession,
  createResetCode,
  createUser,
  deleteResetCode,
  disableMetrics,
  enableMetrics,
  endSession,
  nextIdentity,
  setDeleted,
  extractDoc,
  extractRedirectURL,
  requireVerification,
  wait,
  setupBefore,
  setupBeforeEach
}

async function flushAllStorage () {
  Log.info('flushAllStorage')
  if (dashboard.Storage && dashboard.Storage.flush) {
    await dashboard.Storage.flush()
  }
}

function enableMetrics () {
  global.disableMetrics = false
}

function disableMetrics () {
  global.disableMetrics = true
}

function createRequest (rawURL) {
  const req = {
    language: global.language,
    appid: global.appid,
    url: rawURL,
    urlPath: rawURL.split('?')[0]
  }
  req.route = global.sitemap[req.urlPath]
  if (global.applicationServer && !req.route) {
    req.route = {}
  }
  req.query = querystring.parse(rawURL.split('?')[1])
  for (const verb of ['get', 'post', 'patch', 'delete', 'put']) {
    req[verb] = async () => {
      req.method = verb.toUpperCase()
      if (req.url.startsWith('/api/') || req.puppeteer === false) {
        let errorMessage
        try {
          const result = await proxy(verb, rawURL, req)
          if (generateResponse && process.env.RESPONSE_PATH && req.saveResponse) {
            let responseFilePath = req.filename.substring(req.filename.indexOf('/src/www/') + '/src/www/'.length)
            responseFilePath = path.join(process.env.RESPONSE_PATH, responseFilePath)
            createFolderSync(responseFilePath.substring(0, responseFilePath.lastIndexOf('/')))
            fs.writeFileSync(responseFilePath + 'on', JSON.stringify(result, null, '  '))
          }
          if (req.puppeteer === false) {
            return { html: result }
          }
          if (!result || result.object !== 'error') {
            return result
          }
          errorMessage = result ? result.message : null
        } catch (error) {
          errorMessage = error
        }
        Log.error('request proxy error', errorMessage, req)
        if (errorMessage === 'socket hang up') {
          return req[verb]()
        }
        throw new Error(errorMessage.message || errorMessage || 'api proxying failed')
      }
      let result
      try {
        result = await TestHelperPuppeteer.fetch(req.method, req)
        if (!result) {
          throw new Error('there was no result from puppeteer')
        }
      } catch (error) {
        Log.error('request execution error', error)
      }
      return result
    }
  }
  return req
}

function extractDoc (str) {
  if (!str) {
    return null
  }
  if (str.indexOf('srcdoc') === -1) {
    return dashboard.HTML.parse(str)
  }
  let srcdoc = str.substring(str.indexOf('srcdoc'))
  srcdoc = srcdoc.substring(srcdoc.indexOf('<html'))
  srcdoc = srcdoc.substring(0, srcdoc.indexOf('</html>') + '</html>'.length)
  return dashboard.HTML.parse(srcdoc)
}

function extractRedirectURL (doc) {
  const metaTags = doc.getElementsByTagName('meta')
  if (metaTags && metaTags.length) {
    for (const metaTag of metaTags) {
      if (!metaTag.attr || !metaTag.attr.content || metaTag.attr['http-equiv'] !== 'refresh') {
        continue
      }
      return metaTag.attr.content.split(';url=')[1]
    }
  }
  return null
}

function nextIdentity () {
  const gender = Math.random() > 0.5 ? 'female' : 'male'
  const firstName = faker.name.firstName(gender)
  const lastName = faker.name.lastName(gender)
  return {
    firstName,
    lastName,
    email: faker.internet.email(firstName, lastName)
  }
}

let userNumber = 0

async function createAdministrator (owner) {
  Log.info('createAdministrator', owner)
  const administrator = await createUser(`administrator${userNumber++}`)
  if (!administrator.account.administrator) {
    if (!owner) {
      throw new Error('created a user with no owner to elevate permissions')
    }
    const credentials = administrator.account
    const req2 = createRequest(`/api/administrator/set-account-administrator?accountid=${administrator.account.accountid}`)
    req2.account = owner.account
    req2.session = owner.session
    administrator.account = await req2.patch(req2)
    administrator.account.username = credentials.username
    administrator.account.password = credentials.password
  }
  return administrator
}

async function createOwner () {
  Log.info('createOwner')
  const owner = await createUser(`owner${userNumber++}`)
  if (!owner.account.administrator) {
    await dashboard.Storage.Account.update({
      administratorSince: new Date()
    }, {
      where: {
        accountid: owner.account.accountid
      }
    })
    owner.account.administratorSince = new Date()
    owner.account.administrator = true
  }
  if (!owner.account.owner) {
    await dashboard.Storage.Account.update({
      ownerSince: new Date()
    }, {
      where: {
        accountid: owner.account.accountid
      }
    })
    owner.account.ownerSince = new Date()
    owner.account.owner = true
  }
  return owner
}

async function createUser (username) {
  Log.info('createUser', username)
  username = username || `user${userNumber++}`
  const password = username
  const req = createRequest('/api/user/create-account')
  const requireProfileWas = global.requireProfile
  const profileFieldsWere = global.userProfileFields
  global.requireProfile = true
  global.userProfileFields = ['full-name', 'contact-email']
  const identity = nextIdentity()
  req.body = {
    username,
    password,
    'full-name': identity.firstName + ' ' + identity.lastName,
    'contact-email': identity.email
  }
  let account = await req.post()
  account.username = username
  account.password = password
  const req2 = createRequest(`/api/user/create-session?accountid=${account.accountid}`)
  req2.body = {
    username,
    password
  }
  let session = await req2.post()
  const req4 = createRequest(`/api/user/account?accountid=${account.accountid}`)
  req4.account = account
  req4.session = session
  account = await req4.get()
  const req3 = createRequest(`/api/user/profile?profileid=${account.profileid}`)
  req3.account = account
  req3.session = session
  const profile = await req3.get()
  const req5 = createRequest(`/api/user/session?sessionid=${session.sessionid}`)
  req5.account = account
  req5.session = session
  const token = session.token
  session = await req5.get()
  const user = { profile, account, session }
  user.session.token = token
  user.account.username = username
  user.account.password = password
  global.requireProfile = requireProfileWas
  global.userProfileFields = profileFieldsWere
  return user
}

async function createSession (user, remember) {
  Log.info('createSession', user)
  const req = createRequest(`/api/user/create-session?accountid=${user.account.accountid}`)
  req.body = {
    username: user.account.username,
    password: user.account.password,
    remember: remember || ''
  }
  user.session = await req.post()
  return user.session
}

async function requireVerification (user, days) {
  Log.info('requireVerification', user)
  const req = createRequest(`/api/require-verification?sessionid=${user.session.sessionid}&days=${days}`)
  req.account = user.account
  req.session = user.session
  const newSession = await req.patch()
  user.session.lastVerifiedAt = newSession.lastVerifiedAt
  return user.session
}

async function completeVerification (user) {
  Log.info('completeVerification', user)
  const req = createRequest(`/api/user/set-session-verified?sessionid=${user.session.sessionid}`)
  req.account = user.account
  req.session = user.session
  req.body = {
    username: user.account.username,
    password: user.account.password
  }
  const newSession = await req.patch()
  user.session.lastVerifiedAt = newSession.lastVerifiedAt
  return user.session
}

async function endSession (user) {
  Log.info('endSession', user)
  const req = createRequest(`/api/user/set-session-ended?sessionid=${user.session.sessionid}`)
  req.account = user.account
  req.session = user.session
  user.session = await req.patch()
  return user.session
}

async function setDeleted (user) {
  Log.info('setDeleted', user)
  const req = createRequest(`/api/user/set-account-deleted?accountid=${user.account.accountid}`)
  req.account = user.account
  req.session = user.session
  req.body = {
    password: user.account.password
  }
  user.account = await req.patch()
  user.account.username = req.account.username
  user.account.password = req.account.password
  return user.account
}

let resetCodeNumber = 0
async function createResetCode (user) {
  Log.info('createResetCode', user)
  const code = 'secret' + resetCodeNumber++
  const req = createRequest(`/api/user/create-reset-code?accountid=${user.account.accountid}`)
  req.account = user.account
  req.session = user.session
  req.body = {
    'secret-code': code
  }
  user.resetCode = await req.post()
  user.resetCode.code = code
  return user.resetCode
}

async function deleteResetCode (user) {
  Log.info('deleteResetCode', user)
  const req = createRequest(`/api/user/delete-reset-code?codeid=${user.resetCode.codeid}`)
  req.account = user.account
  req.session = user.session
  await req.delete()
}

async function createProfile (user, properties) {
  Log.info('createProfile', user)
  const req = createRequest(`/api/user/create-profile?accountid=${user.account.accountid}`)
  req.account = user.account
  req.session = user.session
  req.body = properties
  user.profile = await req.post()
  return user.profile
}

const proxy = util.promisify((method, path, req, callback) => {
  const baseURLParts = global.dashboardServer.split('://')
  let host, port
  const colon = baseURLParts[1].indexOf(':')
  if (colon > -1) {
    port = baseURLParts[1].substring(colon + 1)
    host = baseURLParts[1].substring(0, colon)
  } else if (baseURLParts[0] === 'https') {
    port = 443
    host = baseURLParts[1]
  } else if (baseURLParts[0] === 'http') {
    port = 80
    host = baseURLParts[1]
  }
  const requestOptions = {
    host,
    path,
    port,
    timeout: 180000,
    method: method.toUpperCase(),
    headers: {
      'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X x.y; rv:42.0) Gecko/20100101 Firefox/42.0'
    }
  }
  let postData
  if (req.body) {
    if (req.body.length) {
      postData = req.body
      requestOptions.headers = req.headers
    } else {
      postData = querystring.stringify(req.body)
      requestOptions.headers['content-length'] = postData.length
    }
    requestOptions.headers['content-type'] = requestOptions.headers['content-type'] || 'application/x-www-form-urlencoded'
  }
  if (req.session && req.session.expiresAt) {
    const expires = new Date(req.session.expiresAt)
    requestOptions.headers.cookie = `sessionid=${req.session.sessionid}; token=${req.session.token}; expires=${expires.toUTCString()}; path=/`
  }
  if (req.headers) {
    for (const header in req.headers) {
      requestOptions.headers[header] = req.headers[header]
    }
  }
  Log.info('proxy request', requestOptions)
  const protocol = baseURLParts[0] === 'https' ? https : http
  let ended
  const proxyRequest = protocol.request(requestOptions, (proxyResponse) => {
    let body = ''
    proxyResponse.on('data', (chunk) => {
      body += chunk
    })
    return proxyResponse.on('end', () => {
      if (ended) {
        return
      }
      if (!body) {
        return callback()
      }
      if (proxyResponse.headers['set-cookie']) {
        const cookie = proxyResponse.headers['set-cookie']
        const sessionid = cookie[0].substring(cookie[0].indexOf('=') + 1)
        const expires = cookie[0].substring(cookie[0].indexOf('expires=') + 'expires='.length)
        const token = cookie[1].substring(cookie[1].indexOf('=') + 1)
        req.session = {
          sessionid: sessionid.split(';')[0],
          token: token.split(';')[0],
          expiresAt: new Date(expires)
        }
      }
      if (proxyResponse.headers['content-type']) {
        if (proxyResponse.headers['content-type'].startsWith('application/json')) {
          try {
            body = JSON.parse(body)
          } catch (error) {
            Log.error('proxy error parsing JSON', error, body)
          }
          if (body && body.object === 'error') {
            Log.error('proxy response was error', body)
            return callback(new Error(body.message))
          }
          Log.info('proxy response was JSON', body)
          return callback(null, body)
        }
      }
      return callback(null, body)
    })
  })
  proxyRequest.on('error', (error) => {
    Log.error('proxy error', error)
    ended = true
    try {
      if (proxyRequest && proxyRequest.end) {
        proxyRequest.end()
      }
    } catch (error) {
    }
    return callback(error)
  })
  if (postData) {
    proxyRequest.write(postData)
  }
  return proxyRequest.end()
})

function createFolderSync (folderPath) {
  const nestedParts = folderPath.split('/')
  let nestedPath = ''
  for (const part of nestedParts) {
    nestedPath += `/${part}`
    if (!fs.existsSync(nestedPath)) {
      fs.mkdirSync(nestedPath)
    }
  }
}

function createMultiPart (req, body, uploads) {
  const boundary = '-----------------test' + global.testNumber
  const delimiter = `\r\n--${boundary}`
  const closeDelimiter = delimiter + '--'
  const buffers = []
  if (uploads) {
    for (const field in uploads) {
      const filename = uploads[field].filename
      const extension = filename.substring(filename.indexOf('.') + 1).toLowerCase()
      const type = mimeTypes[extension]
      const segment = [
        delimiter,
        `content-disposition: form-data; name="${field}"; filename="${filename}"`,
        `content-type: ${type}`,
        '\r\n'
      ]
      buffers.push(Buffer.from(segment.join('\r\n')), fs.readFileSync(uploads[field].path), Buffer.from('\r\n'))
    }
  }
  for (const field in body) {
    buffers.push(Buffer.from(`${delimiter}\r\ncontent-disposition: form-data; name="${field}"\r\n\r\n${body[field]}`))
  }
  buffers.push(Buffer.from(closeDelimiter))
  const multipartBody = Buffer.concat(buffers)
  req.headers = req.headers || {}
  req.headers['content-type'] = `multipart/form-data; boundary=${boundary}`
  req.headers['content-length'] = multipartBody.length
  return multipartBody
}
