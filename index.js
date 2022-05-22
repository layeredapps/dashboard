let defaultSessionKey
if (process.env.NODE_ENV !== 'production') {
  defaultSessionKey = 'dashboard-session-key'
}
global.host = process.env.HOST || 'localhost'
global.port = parseInt(process.env.PORT || '8000', 10)
if (process.env.DASHBOARD_SERVER) {
  global.dashboardServer = process.env.DASHBOARD_SERVER
} else {
  const protocol = global.port === 443 ? 'https' : 'http'
  global.dashboardServer = `${protocol}://${global.host}:${global.port}`
}
global.applicationServer = process.env.APPLICATION_SERVER
global.applicationServerToken = process.env.APPLICATION_SERVER_TOKEN
if (global.applicationServer && !global.applicationServerToken) {
  throw new Error('Invalid APPLICATION_SERVER_TOKEN')
}
global.dashboardSessionKey = process.env.DASHBOARD_SESSION_KEY || defaultSessionKey
global.bcryptWorkloadFactor = parseInt(process.env.BCRYPT_WORKLOAD_FACTOR || '10', 10)
if (!global.dashboardSessionKey) {
  throw new Error('Invalid DASHBOARD_SESSION_KEY')
}
global.disableMetrics = process.env.DISABLE_METRICS === 'true'
global.disableRegistration = process.env.DISABLE_REGISTRATION === 'true'
global.requireProfile = process.env.REQUIRE_PROFILE === 'true'
global.profileFields = ['display-name', 'display-email', 'contact-email', 'full-name', 'dob', 'phone', 'occupation', 'location', 'company-name', 'website']
global.profileFieldMap = {}
for (const field of global.profileFields) {
  let displayName = field
  if (displayName.indexOf('-') > -1) {
    displayName = displayName.split('-')
    if (displayName.length === 1) {
      displayName = displayName[0]
    } else if (displayName.length === 2) {
      displayName = displayName[0] + displayName[1].substring(0, 1).toUpperCase() + displayName[1].substring(1)
    } else if (displayName.length === 3) {
      displayName = displayName[0] + displayName[1].substring(0, 1).toUpperCase() + displayName[1].substring(1) + displayName[2].substring(0, 1).toUpperCase() + displayName[2].substring(1)
    }
  }
  global.profileFieldMap[field] = displayName
}

if (!process.env.USER_PROFILE_FIELDS) {
  global.userProfileFields = [
    'contact-email',
    'full-name'
  ]
} else {
  global.userProfileFields = process.env.USER_PROFILE_FIELDS.split(',')
}
global.appid = process.env.APPID || process.env.DOMAIN || 'dashboard'
global.domain = process.env.DOMAIN || ''
global.language = process.env.LANGUAGE || 'en'
global.homePath = process.env.HOME_PATH ? process.env.HOME_PATH : undefined
global.maximumPostDataLength = parseInt(process.env.MAXIMUM_POST_DATA_LENGTH || '2000000', 10)
global.minimumUsernameLength = parseInt(process.env.MINIMUM_USERNAME_LENGTH || '6', 10)
global.maximumUsernameLength = parseInt(process.env.MAXIMUM_USERNAME_LENGTH || '50', 10)
global.minimumPasswordLength = parseInt(process.env.MINIMUM_PASSWORD_LENGTH || '6', 10)
global.maximumPasswordLength = parseInt(process.env.MAXIMUM_PASSWORD_LENGTH || '50', 10)
global.minimumResetCodeLength = parseInt(process.env.MINIMUM_RESET_CODE_LENGTH || '6', 10)
global.maximumResetCodeLength = parseInt(process.env.MAXIMUM_RESET_CODE_LENGTH || '50', 10)
global.minimumProfileFullNameLength = parseInt(process.env.MINIMUM_PROFILE_FULL_NAME_LENGTH || '1', 10)
global.maximumProfileFullNameLength = parseInt(process.env.MAXIMUM_PROFILE_FULL_NAME_LENGTH || '50', 10)
global.minimumProfileDisplayNameLength = parseInt(process.env.MINIMUM_PROFILE_DISPLAY_NAME_LENGTH || '1', 10)
global.maximumProfileDisplayNameLength = parseInt(process.env.MAXIMUM_PROFILE_DISPLAY_NAME_LENGTH || '50', 10)
global.minimumProfileCompanyNameLength = parseInt(process.env.MINIMUM_PROFILE_COMPANY_NAME_LENGTH || '1', 10)
global.maximumProfileCompanyNameLength = parseInt(process.env.MAXIMUM_PROFILE_COMPANY_NAME_LENGTH || '50', 10)
global.cacheApplicationServerFiles = parseInt(process.env.CACHE_APPLICATION_SERVER_FILES || '60', 10)
global.deleteDelay = parseInt(process.env.DELETE_DELAY || '7', 10)
global.pageSize = parseInt(process.env.PAGE_SIZE || '10', 10)
global.sessionVerificationDelay = parseInt(process.env.SESSION_VERIFICATION_DELAY || '14400', 10)
global.contentSecurityPolicy = process.env.CONTENT_SECURITY_POLICY || ''
global.inlineCSS = process.env.INLINE_CSS === 'true'
global.inlineJS = process.env.INLINE_JS === 'true'
global.inlineSVG = process.env.INLINE_SVG === 'true'
global.hotReload = process.env.HOT_RELOAD === 'true'

let Server

const dashboard = module.exports = {
  Format: require('./src/format.js'),
  Hash: require('./src/hash.js'),
  HTML: require('./src/html.js'),
  Proxy: require('./src/proxy.js'),
  Response: require('./src/response.js'),
  Validate: require('./src/validate.js'),
  start: async (applicationPath) => {
    const API = require('./src/api.js')
    const PackageJSON = require('./src/package-json.js')
    const Sitemap = require('./src/sitemap.js')
    const documentation = require('./documentation.js')
    global.applicationPath = global.applicationPath || applicationPath
    // the package.json merged from your package.json for dashboard server + dashboard + modules
    global.packageJSON = PackageJSON.merge()
    global.packageJSON.dashboard.serverFilePaths.push(require.resolve('./src/server/check-csrf-token.js'))
    global.packageJSON.dashboard.server.push(require('./src/server/check-csrf-token.js'))
    global.packageJSON.dashboard.contentFilePaths.push(require.resolve('./src/content/insert-csrf-token.js'))
    global.packageJSON.dashboard.content.push(require('./src/content/insert-csrf-token.js'))
    global.packageJSON.dashboard.serverFilePaths.push(require.resolve('./src/server/check-xss-injection.js'))
    global.packageJSON.dashboard.server.push(require('./src/server/check-xss-injection.js'))
    global.packageJSON.dashboard.contentFilePaths.push(require.resolve('./src/content/set-form-return-url.js'))
    global.packageJSON.dashboard.content.push(require('./src/content/set-form-return-url.js'))
    if (global.applicationServer) {
      global.packageJSON.dashboard.serverFilePaths.push(
        require.resolve('./src/server/fetch-application-server-special-html.js'),
        require.resolve('./src/server/fetch-application-server-static-file.js')
      )
      global.packageJSON.dashboard.server.push(
        require('./src/server/fetch-application-server-special-html.js'),
        require('./src/server/fetch-application-server-static-file.js')
      )
    }
    if (global.hotReload) {
      global.packageJSON.dashboard.serverFilePaths.unshift(
        require.resolve('./src/server/hot-reload.js')
      )
      global.packageJSON.dashboard.server.unshift(
        require('./src/server/hot-reload.js')
      )
    }
    if (global.inlineCSS) {
      global.packageJSON.dashboard.contentFilePaths.push(
        require.resolve('./src/content/inline-css.js')
      )
      global.packageJSON.dashboard.content.push(
        require('./src/content/inline-css.js')
      )
    }
    if (global.inlineJS) {
      global.packageJSON.dashboard.contentFilePaths.push(
        require.resolve('./src/content/inline-js.js')
      )
      global.packageJSON.dashboard.content.push(
        require('./src/content/inline-js.js')
      )
    }
    if (global.inlineSVG) {
      global.packageJSON.dashboard.contentFilePaths.push(
        require.resolve('./src/content/inline-svg.js')
      )
      global.packageJSON.dashboard.content.push(
        require('./src/content/inline-svg.js')
      )
    }
    // the sitemap merged from your dashboard server + dashboard + modules
    global.sitemap = Sitemap.generate()
    if (global.homePath || global.applicationServer) {
      delete global.sitemap['/home']
      delete global.sitemap['/']
    }
    // the API merged from your dashboard server + dashboard + modules
    global.api = API.generate()
    // storage initialization
    if (!dashboard.Storage) {
      await dashboard.setup()
    }
    // helper file generation
    if (process.env.GENERATE_SITEMAP_TXT !== 'false') {
      documentation.writeSitemap()
    }
    if (process.env.GENERATE_API_TXT !== 'false') {
      documentation.writeAPI()
    }
    if (process.env.GENERATE_ENV_TXT !== 'false') {
      documentation.writeEnvironment()
    }
    // the web server
    Server = require('./src/server.js')
    await Server.start()
    // exit for if you just want the helper files generated
    if (process.env.EXIT_ON_START) {
      dashboard.stop()
      return process.exit(0)
    }
  },
  stop: () => {
    if (!Server) {
      return
    }
    dashboard.Storage.sequelize.close()
    dashboard.StorageCache.close()
    return Server.stop()
  },
  setup: async () => {
    const Log = require('./src/log.js')('dashboard')
    if (!dashboard.Storage) {
      Log.info('setting up dashboard storage')
      const Storage = require('./src/storage.js')
      dashboard.Storage = await Storage()
      dashboard.StorageCache = require('./src/storage-cache.js')
      await dashboard.StorageCache.setup()
      dashboard.Metrics = require('./src/metrics.js')
      await dashboard.Metrics.setup(dashboard.Storage)
    }
    Log.info('setting up module storage')
    if (global.packageJSON.dashboard.modules && global.packageJSON.dashboard.modules.length) {
      for (const i in global.packageJSON.dashboard.modules) {
        const addition = global.packageJSON.dashboard.modules[i]
        Log.info('setting up module', global.packageJSON.dashboard.moduleNames[i])
        if (addition.setup) {
          try {
            await addition.setup()
          } catch (error) {
            Log.error(error)
          }
        }
      }
    }
    Log.info('finished setting up')
  }
}
