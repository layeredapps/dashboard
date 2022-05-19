/* eslint-env mocha */
const assert = require('assert')
const PackageJSON = require('./package-json.js')

describe('internal-api/package-json', () => {
  before(() => {
    global.testingPackageJSON = true
  })
  after(() => {
    global.testingPackageJSON = false
  })
  function blankPackageJSON () {
    return {
      dashboard: {
        server: [],
        serverFilePaths: [],
        content: [],
        contentFilePaths: [],
        prozxy: [],
        proxyFilePaths: [],
        modules: [],
        moduleNames: [],
        moduleVersions: [],
        menus: {
          account: [],
          administrator: []
        }
      }
    }
  }
  describe('mergeTitle', () => {
    it('should prioritize application title', async () => {
      const applicationJSON = blankPackageJSON()
      applicationJSON.dashboard.title = 'Application title'
      const dashboardJSON = blankPackageJSON()
      dashboardJSON.dashboard.title = 'Dashboard title'
      const packageJSON = blankPackageJSON()
      PackageJSON.mergeTitle(packageJSON, dashboardJSON, applicationJSON)
      assert.strictEqual(packageJSON.dashboard.title, 'Application title')
    })

    it('should default to Dashboard title', async () => {
      const applicationJSON = blankPackageJSON()
      const dashboardJSON = blankPackageJSON()
      dashboardJSON.dashboard.title = 'Dashboard title'
      const packageJSON = {
        dashboard: {}
      }
      PackageJSON.mergeTitle(packageJSON, dashboardJSON, applicationJSON)
      assert.strictEqual(packageJSON.dashboard.title, 'Dashboard title')
    })
  })

  describe('mergeScriptArray', () => {
    it('should add scripts', async () => {
      const dashboardJSON = blankPackageJSON()
      dashboardJSON.dashboard.server = [
        './server/allow-api-access-cross-domain.js',
        './server/allow-api-access.js',
        './server/allow-api-requests-from-application.js'
      ]
      const packageJSON = blankPackageJSON()
      PackageJSON.mergeScriptArray(packageJSON, dashboardJSON, 'server')
      assert.strictEqual(packageJSON.dashboard.server[0], require.resolve('./server/allow-api-access-cross-domain.js'))
      assert.strictEqual(packageJSON.dashboard.server[1], require.resolve('./server/allow-api-access.js'))
      assert.strictEqual(packageJSON.dashboard.server[2], require.resolve('./server/allow-api-requests-from-application.js'))
    })

    it('should put application scripts last', async () => {
      const dashboardJSON = blankPackageJSON()
      dashboardJSON.dashboard.server = [
        './server/allow-api-access-cross-domain.js',
        './server/allow-api-access.js',
        './server/allow-api-requests-from-application.js'
      ]
      const applicationJSON = blankPackageJSON()
      applicationJSON.dashboard.server = [
        './server/fetch-application-server-special-html.js'
      ]
      const packageJSON = blankPackageJSON()
      PackageJSON.mergeScriptArray(packageJSON, dashboardJSON, 'server')
      PackageJSON.mergeScriptArray(packageJSON, applicationJSON, 'server')
      assert.strictEqual(packageJSON.dashboard.server[0], require.resolve('./server/allow-api-access-cross-domain.js'))
      assert.strictEqual(packageJSON.dashboard.server[1], require.resolve('./server/allow-api-access.js'))
      assert.strictEqual(packageJSON.dashboard.server[2], require.resolve('./server/allow-api-requests-from-application.js'))
      assert.strictEqual(packageJSON.dashboard.server[3], require.resolve('./server/fetch-application-server-special-html.js'))
    })
  })

  // describe('mergeSpecialHTML', () => {
  //   it('should merge package pages', async () => {
  //   })

  //   it('should put module HTML pages second', async () => {
  //   })

  //   it('should put application HTML pages last', async () => {
  //   })
  // })

  // describe('mergeMenuLinks', () => {
  //   it('should put Dashboard menu links first', async () => {
  //   })

  //   it('should put module menu links second', async () => {
  //   })

  //   it('should put application menu links last', async () => {
  //   })
  // })
})
