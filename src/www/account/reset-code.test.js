/* eslint-env mocha */
const assert = require('assert')
const TestHelper = require('../../../test-helper.js')

describe('/account/reset-code', () => {
  describe('before', () => {
    it('should bind data to req', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createResetCode(user)
      const req = TestHelper.createRequest(`/account/reset-code?codeid=${user.resetCode.codeid}`)
      req.account = user.account
      req.session = user.session
      await req.route.api.before(req)
      assert.strictEqual(req.data.resetCode.codeid, user.resetCode.codeid)
    })
  })

  describe('view', () => {
    it('should present the reset code table (screenshots)', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createResetCode(user)
      const req = TestHelper.createRequest(`/account/reset-code?codeid=${user.resetCode.codeid}`)
      req.account = user.account
      req.session = user.session
      req.filename = __filename
      req.screenshots = [
        { hover: '#account-menu-container' },
        { click: '/account' },
        { click: '/account/reset-codes' },
        { click: `/account/reset-code?codeid=${user.resetCode.codeid}` }
      ]
      global.pageSize = 50
      const result = await req.get()
      const doc = TestHelper.extractDoc(result.html)
      const table = doc.getElementById('reset-codes-table')
      const tbody = table.getElementById(user.resetCode.codeid)
      assert.strictEqual(tbody.tag, 'tbody')
    })
  })

  describe('errors', () => {
    it('invalid-reset-codeid', async () => {
      const user = await TestHelper.createUser()
      const req = TestHelper.createRequest('/account/reset-code?codeid=invalid')
      req.account = user.account
      req.session = user.session
      await req.route.api.before(req)
      assert.strictEqual(req.error, 'invalid-reset-codeid')
    })

    it('invalid-account', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createResetCode(user)
      const user2 = await TestHelper.createUser()
      const req = TestHelper.createRequest(`/account/reset-code?codeid=${user.resetCode.codeid}`)
      req.account = user2.account
      req.session = user2.session
      await req.route.api.before(req)
      assert.strictEqual(req.error, 'invalid-account')
    })
  })
})
