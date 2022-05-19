/* eslint-env mocha */
const assert = require('assert')
const properties = [
  { camelCase: 'pageSize', raw: 'PAGE_SIZE', description: 'Rows of data per page', value: '7', default: '10', valueDescription: 'Integer' },
  { camelCase: 'dashboardServer', raw: 'DASHBOARD_SERVER', description: 'URL of dashboard server', value: 'https://1.2.3.4', noDefaultValue: true, valueDescription: 'Address' },
  { camelCase: 'dashboardSessionKey', raw: 'DASHBOARD_SESSION_KEY', description: 'An application-level secret for user session tokens', value: 'a-secret', noDefaultValue: true, valueDescription: 'String' },
  { camelCase: 'domain', raw: 'DOMAIN', description: 'Domain of server', value: 'example.com', default: '', valueDescription: 'String' },
  { camelCase: 'host', raw: 'HOST', description: 'IP or address web server listens on', value: '0.0.0.0', default: 'localhost', valueDescription: 'IP address' },
  { camelCase: 'port', raw: 'PORT', description: 'Port web server listens on', value: '9000', default: '8000', valueDescription: 'Integer' },
  { camelCase: 'homePath', raw: 'HOME_PATH', description: 'Alternative path for application home', value: '/app', noDefaultValue: true, valueDescription: 'String' },
  { camelCase: 'deleteDelay', raw: 'DELETE_DELAY', description: 'Cool-down time in days to delete accounts', value: '3', default: '7', valueDescription: 'Integer' },
  { camelCase: 'applicationServer', raw: 'APPLICATION_SERVER', description: 'URL of application server', value: 'http://localhost:3000', noDefaultValue: true, valueDescription: 'Address' },
  { camelCase: 'applicationServerToken', raw: 'APPLICATION_SERVER_TOKEN', description: 'Secret shared between servers', value: 'secret', noDefaultValue: true, valueDescription: 'String' },
  { camelCase: 'bcryptWorkloadFactor', raw: 'BCRYPT_WORKLOAD_FACTOR', description: 'Strength to protect passwords', value: '4', default: '10', valueDescription: 'Integer' },
  { camelCase: 'disableMetrics', raw: 'DISABLE_METRICS', description: 'Disable aggregated metrics', value: 'false', default: '', valueDescription: 'Boolean' },
  { camelCase: 'disableRegistration', raw: 'DISABLE_REGISTRATION', description: 'Disable UI (not API) for registering', value: 'false', default: '', valueDescription: 'Boolean' },
  { camelCase: 'maximumPostDataLength', raw: 'MAXIMUM_POST_DATA_LENGTH', description: 'Largest POST payload accepted in bytes', value: '1000000', default: '2000000', valueDescription: 'Integer' },
  { camelCase: 'minimumPasswordLength', raw: 'MINIMUM_PASSWORD_LENGTH', description: 'Shortest password length', value: '1', default: '6', valueDescription: 'Integer' },
  { camelCase: 'maximumPasswordLength', raw: 'MAXIMUM_PASSWORD_LENGTH', description: 'Longest password length', value: '1000', default: '50', valueDescription: 'Integer' },
  { camelCase: 'minimumUsernameLength', raw: 'MINIMUM_USERNAME_LENGTH', description: 'Shortest username length', value: '1', default: '6', valueDescription: 'Integer' },
  { camelCase: 'maximumUsernameLength', raw: 'MAXIMUM_USERNAME_LENGTH', description: 'Longest username length', value: '1000', default: '50', valueDescription: 'Integer' },
  { camelCase: 'minimumResetCodeLength', raw: 'MINIMUM_RESET_CODE_LENGTH', description: 'Shortest reset code length', value: '1', default: '6', valueDescription: 'Integer' },
  { camelCase: 'maximumResetCodeLength', raw: 'MAXIMUM_RESET_CODE_LENGTH', description: 'Longest reset code length', value: '1000', default: '50', valueDescription: 'Integer' },
  { camelCase: 'requireProfile', raw: 'REQUIRE_PROFILE', description: 'Require registration information', value: 'true', default: '', valueDescription: 'Integer' },
  { camelCase: 'userProfileFields', raw: 'USER_PROFILE_FIELDS', description: 'Information to collect at registration', value: 'full-name,contact-email,display-name,display-email,dob,location,phone,company-name,website,occupation', default: 'contact-email,full-name', valueDescription: 'Profile property list' },
  { camelCase: 'sessionVerificationDelay', raw: 'SESSION_VERIFICATION_DELAY', description: 'Seconds before verifying a prolongued session', value: '28800', default: '14400', valueDescription: 'Integer' },
  { camelCase: 'cacheApplicationServerFiles', raw: 'CACHE_APPLICATION_SERVER_FILES', description: 'Seconds to cache files from application server', value: '600', default: '60', valueDescription: 'Integer' }
]

describe('index', () => {
  for (const property of properties) {
    describe(property.raw, () => {
      describe(property.description, () => {
        if (!property.noDefaultValue) {
          it('default ' + (property.default || property.defaultDescription || 'unset'), async () => {
            const port = 2000 + Math.floor(Math.random() * 50000)
            if (property.raw.startsWith('APPLICATION_SERVER')) {
              if (property.raw === 'APPLICATION_SERVER') {
                process.env.APPLICATION_SERVER_TOKEN = 'a secret string'
              } else {
                process.env.APPLICATION_SERVER = `http://localhost:${port}`
              }
            }
            delete (process.env[property.raw])
            delete require.cache[require.resolve('./index.js')]
            require('./index.js')
            delete require.cache[require.resolve('./index.js')]
            assert.strictEqual((global[property.camelCase] || '').toString().trim(), property.default.toString())
          })
        }
        it(property.valueDescription, async () => {
          const port = 2000 + Math.floor(Math.random() * 50000)
          process.env[property.raw] = property.value
          if (property.raw.startsWith('APPLICATION_SERVER')) {
            if (property.raw === 'APPLICATION_SERVER') {
              process.env.APPLICATION_SERVER_TOKEN = 'a secret string'
            } else {
              process.env.APPLICATION_SERVER = `http://localhost:${port}`
            }
          }
          delete require.cache[require.resolve('./index.js')]
          require('./index.js')
          delete require.cache[require.resolve('./index.js')]
          assert.strictEqual(global[property.camelCase].toString(), property.value)
        })
      })
    })
  }
})
