/* eslint-env mocha */
const assert = require('assert')
const TestHelper = require('../../../test-helper.js')
const ScreenshotData = require('../../../screenshot-data.js')

describe('/administrator/delete-account', () => {
  describe('before', () => {
    it('should bind data to req', async () => {
      global.deleteDelay = 0
      const administrator = await TestHelper.createOwner()
      const user = await TestHelper.createUser()
      await TestHelper.setDeleted(user)
      const req = TestHelper.createRequest(`/administrator/delete-account?accountid=${user.account.accountid}`)
      req.account = administrator.account
      req.session = administrator.session
      await req.route.api.before(req)
      assert.strictEqual(req.data.account.accountid, user.account.accountid)
    })
  })

  describe('view', () => {
    it('should present the form', async () => {
      global.deleteDelay = 0
      const administrator = await TestHelper.createOwner()
      const user = await TestHelper.createUser()
      await TestHelper.setDeleted(user)
      const req = TestHelper.createRequest(`/administrator/delete-account?accountid=${user.account.accountid}`)
      req.account = administrator.account
      req.session = administrator.session
      const result = await req.get()
      const doc = TestHelper.extractDoc(result.html)
      assert.strictEqual(doc.getElementById('submit-form').tag, 'form')
      assert.strictEqual(doc.getElementById('submit-button').tag, 'button')
    })
  })

  describe('submit', () => {
    it('should immediately delete (screenshots)', async () => {
      global.deleteDelay = -1
      const administrator = await TestHelper.createOwner()
      const user = await TestHelper.createUser()
      await TestHelper.setDeleted(user)
      const req = TestHelper.createRequest(`/administrator/delete-account?accountid=${user.account.accountid}`)
      req.account = administrator.account
      req.session = administrator.session
      req.filename = __filename
      req.screenshots = [
        { hover: '#administrator-menu-container' },
        { click: '/administrator' },
        { click: '/administrator/accounts' },
        { click: `/administrator/account?accountid=${user.account.accountid}` },
        { click: `/administrator/delete-account?accountid=${user.account.accountid}` },
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
    it('invalid-account-not-deleting', async () => {
      const administrator = await TestHelper.createOwner()
      const user = await TestHelper.createUser()
      const req = TestHelper.createRequest(`/administrator/delete-account?accountid=${user.account.accountid}`)
      req.account = administrator.account
      req.session = administrator.session
      await req.route.api.before(req)
      assert.strictEqual(req.error, 'invalid-account-not-deleting')
    })

    it('invalid-owner-account', async () => {
      const owner = await TestHelper.createOwner()
      const administrator = await TestHelper.createAdministrator(owner)
      const req = TestHelper.createRequest(`/administrator/delete-account?accountid=${owner.account.accountid}`)
      req.account = administrator.account
      req.session = administrator.session
      await req.route.api.before(req)
      assert.strictEqual(req.error, 'invalid-owner-account')
    })

    it('invalid-administrator-account', async () => {
      const owner = await TestHelper.createOwner()
      const administrator = await TestHelper.createAdministrator(owner)
      const req = TestHelper.createRequest(`/administrator/delete-account?accountid=${administrator.account.accountid}`)
      req.account = owner.account
      req.session = owner.session
      await req.route.api.before(req)
      assert.strictEqual(req.error, 'invalid-administrator-account')
    })

    it('invalid-accountid', async () => {
      const administrator = await TestHelper.createOwner()
      const req = TestHelper.createRequest('/administrator/delete-account?accountid=invalid')
      req.account = administrator.account
      req.session = administrator.session
      await req.route.api.before(req)
      assert.strictEqual(req.error, 'invalid-accountid')
    })

    it('invalid-csrf-token', async () => {
      const administrator = await TestHelper.createOwner()
      const user = await TestHelper.createUser()
      await TestHelper.setDeleted(user)
      const req = TestHelper.createRequest(`/administrator/delete-account?accountid=${user.account.accountid}`)
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
