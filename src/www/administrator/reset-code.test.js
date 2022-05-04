/* eslint-env mocha */
const assert = require('assert')
const TestHelper = require('../../../test-helper.js')
const ScreenshotData = require('../../../screenshot-data.js')

describe('/administrator/reset-code', () => {
  describe('before', () => {
    it('should bind data to req', async () => {
      const administrator = await TestHelper.createOwner()
      const user = await TestHelper.createUser()
      await TestHelper.createResetCode(user)
      const req = TestHelper.createRequest(`/administrator/reset-code?codeid=${user.resetCode.codeid}`)
      req.account = administrator.account
      req.session = administrator.session
      await req.route.api.before(req)
      assert.strictEqual(req.data.resetCode.codeid, user.resetCode.codeid)
    })
  })

  describe('view', () => {
    it('should present the reset code table (screenshots)', async () => {
      const administrator = await TestHelper.createOwner()
      const user = await TestHelper.createUser()
      await TestHelper.createResetCode(user)
      const req = TestHelper.createRequest(`/administrator/reset-code?codeid=${user.resetCode.codeid}`)
      req.account = administrator.account
      req.session = administrator.session
      req.filename = __filename
      req.screenshots = [
        { hover: '#administrator-menu-container' },
        { click: '/administrator' },
        { click: '/administrator/reset-codes' },
        { click: `/administrator/reset-code?codeid=${user.resetCode.codeid}` }
      ]
      global.pageSize = 50
      global.packageJSON.dashboard.server.push(ScreenshotData.administratorIndex)
      global.packageJSON.dashboard.server.push(ScreenshotData.administratorResetCodes)
      const result = await req.get()
      const doc = TestHelper.extractDoc(result.html)
      const table = doc.getElementById('reset-codes-table')
      const tbody = table.getElementById(user.resetCode.codeid)
      assert.strictEqual(tbody.tag, 'tbody')
    })
  })

  describe('errors', () => {
    it('invalid-codeid', async () => {
      const administrator = await TestHelper.createOwner()
      const req = TestHelper.createRequest('/administrator/reset-code?codeid=invalid')
      req.account = administrator.account
      req.session = administrator.session
      await req.route.api.before(req)
      assert.strictEqual(req.error, 'invalid-reset-codeid')
    })
  })
})
