/* eslint-env mocha */
const assert = require('assert')
const TestHelper = require('../../../test-helper.js')
const ScreenshotData = require('../../../screenshot-data.js')

describe('/administrator', () => {
  describe('view', () => {
    it('should return page (screenshots)', async () => {
      const administrator = await TestHelper.createOwner()
      const req = TestHelper.createRequest('/administrator')
      req.account = administrator.account
      req.session = administrator.session
      req.filename = __filename
      req.screenshots = [
        { hover: '#administrator-menu-container' },
        { click: '/administrator' }
      ]
      global.pageSize = 50
      global.packageJSON.dashboard.server.push(ScreenshotData.administratorIndex)
      const result = await req.get()
      const doc = TestHelper.extractDoc(result.html)
      const accountsChart = doc.getElementById('accounts-chart')
      assert.strictEqual(accountsChart.child.length, 90)
      const sessionsChart = doc.getElementById('sessions-chart')
      assert.strictEqual(sessionsChart.child.length, 90)
    })
  })
})
