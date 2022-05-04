/* eslint-env mocha */
const assert = require('assert')
const TestHelper = require('../../../test-helper.js')
const ScreenshotData = require('../../../screenshot-data.js')

describe('/administrator/assign-administrator', () => {
  describe('before', () => {
    it('should bind data to req', async () => {
      const administrator = await TestHelper.createOwner()
      const user = await TestHelper.createUser()
      const req = TestHelper.createRequest(`/administrator/assign-administrator?accountid=${user.account.accountid}`)
      req.account = administrator.account
      req.session = administrator.session
      await req.route.api.before(req)
      assert.strictEqual(req.data.account.accountid, user.account.accountid)
    })
  })

  describe('view', () => {
    it('should present the form', async () => {
      const administrator = await TestHelper.createOwner()
      const user = await TestHelper.createUser()
      const req = TestHelper.createRequest(`/administrator/assign-administrator?accountid=${user.account.accountid}`)
      req.account = administrator.account
      req.session = administrator.session
      const result = await req.get()
      const doc = TestHelper.extractDoc(result.html)
      assert.strictEqual(doc.getElementById('submit-form').tag, 'form')
      assert.strictEqual(doc.getElementById('submit-button').tag, 'button')
    })
  })

  describe('submit', () => {
    it('should assign administrator (screenshots)', async () => {
      const administrator = await TestHelper.createOwner()
      const user = await TestHelper.createUser()
      const req = TestHelper.createRequest(`/administrator/assign-administrator?accountid=${user.account.accountid}`)
      req.account = administrator.account
      req.session = administrator.session
      req.filename = __filename
      req.screenshots = [
        { hover: '#administrator-menu-container' },
        { click: '/administrator' },
        { click: '/administrator/accounts' },
        { click: `/administrator/account?accountid=${user.account.accountid}` },
        { click: `/administrator/assign-administrator?accountid=${user.account.accountid}` },
        { fill: '#submit-form' }
      ]
      global.pageSize = 50
      global.packageJSON.dashboard.server.push(ScreenshotData.administratorIndex)
      global.packageJSON.dashboard.server.push(ScreenshotData.administratorAccounts)
      const result = await req.post()
      const doc = TestHelper.extractDoc(result.html)
      const messageContainer = doc.getElementById('message-container')
      const message = messageContainer.child[0]
      assert.strictEqual(message.attr.template, 'success')
    })
  })

  describe('errors', () => {
    it('invalid-account-deleting', async () => {
      const administrator = await TestHelper.createOwner()
      const user = await TestHelper.createUser()
      await TestHelper.setDeleted(user)
      const req = TestHelper.createRequest(`/administrator/assign-administrator?accountid=${user.account.accountid}`)
      req.account = administrator.account
      req.session = administrator.session
      await req.route.api.before(req)
      assert.strictEqual(req.error, 'invalid-account-deleting')
    })

    it('invalid-account-administrator', async () => {
      const administrator = await TestHelper.createOwner()
      const user = await TestHelper.createAdministrator(administrator)
      const req = TestHelper.createRequest(`/administrator/assign-administrator?accountid=${user.account.accountid}`)
      req.account = administrator.account
      req.session = administrator.session
      await req.route.api.before(req)
      assert.strictEqual(req.error, 'invalid-account-administrator')
    })

    it('invalid-accountid', async () => {
      const administrator = await TestHelper.createOwner()
      const req = TestHelper.createRequest('/administrator/assign-administrator?accountid=invalid')
      req.account = administrator.account
      req.session = administrator.session
      await req.route.api.before(req)
      assert.strictEqual(req.error, 'invalid-accountid')
    })

    it('invalid-csrf-token', async () => {
      const administrator = await TestHelper.createOwner()
      const user = await TestHelper.createUser()
      const req = TestHelper.createRequest(`/administrator/assign-administrator?accountid=${user.account.accountid}`)
      req.puppeteer = false
      req.account = administrator.account
      req.session = administrator.session
      req.body = {
        'csrf-token': ''
      }
      const result = await req.post()
      const doc = TestHelper.extractDoc(result.html)
      const messageContainer = doc.getElementById('message-container')
      const message = messageContainer.child[0]
      assert.strictEqual(message.attr.template, 'invalid-csrf-token')
    })
  })
})
