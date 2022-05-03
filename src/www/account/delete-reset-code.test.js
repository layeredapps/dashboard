/* eslint-env mocha */
const assert = require('assert')
const TestHelper = require('../../../test-helper.js')

describe('/account/delete-reset-code', () => {
  describe('before', () => {
    it('should bind data', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createResetCode(user)
      const req = TestHelper.createRequest(`/account/delete-reset-code?codeid=${user.resetCode.codeid}`)
      req.account = user.account
      req.session = user.session
      await req.route.api.before(req)
      assert.strictEqual(req.data.resetCode.codeid, user.resetCode.codeid)
    })
  })

  describe('exceptions', () => {
    it('invalid-reset-codeid', async () => {
      const user = await TestHelper.createUser()
      const req = TestHelper.createRequest('/account/delete-reset-code?codeid=invalid')
      req.account = user.account
      req.session = user.session
      let errorMessage
      try {
        await req.route.api.before(req)
      } catch (error) {
        errorMessage = error.message
      }
      assert.strictEqual(errorMessage, 'invalid-reset-codeid')
    })

    it('invalid-account', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createResetCode(user)
      const user2 = await TestHelper.createUser()
      const req = TestHelper.createRequest(`/account/delete-reset-code?codeid=${user.resetCode.codeid}`)
      req.account = user2.account
      req.session = user2.session
      let errorMessage
      try {
        await req.route.api.before(req)
      } catch (error) {
        errorMessage = error.message
      }
      assert.strictEqual(errorMessage, 'invalid-account')
    })
  })

  describe('view', () => {
    it('should present the form', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createResetCode(user)
      const req = TestHelper.createRequest(`/account/delete-reset-code?codeid=${user.resetCode.codeid}`)
      req.account = user.account
      req.session = user.session
      const result = await req.get()
      const doc = TestHelper.extractDoc(result.html)
      assert.strictEqual(doc.getElementById('submit-form').tag, 'form')
      assert.strictEqual(doc.getElementById('submit-button').tag, 'button')
    })
  })

  describe('submit', () => {
    it('should delete reset code (screenshots)', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createResetCode(user)
      const req = TestHelper.createRequest(`/account/delete-reset-code?codeid=${user.resetCode.codeid}`)
      req.account = user.account
      req.session = user.session
      req.filename = __filename
      req.screenshots = [
        { hover: '#account-menu-container' },
        { click: '/account' },
        { click: '/account/reset-codes' },
        { click: `/account/reset-code?codeid=${user.resetCode.codeid}` },
        { click: `/account/delete-reset-code?codeid=${user.resetCode.codeid}` },
        { fill: '#submit-form' }
      ]
      global.pageSize = 50
      await req.post()
      const req2 = TestHelper.createRequest(`/api/user/reset-code?codeid=${user.resetCode.codeid}`)
      req2.account = user.account
      req2.session = user.session
      let errorMessage
      try {
        await req2.get()
      } catch (error) {
        errorMessage = error.message
      }
      assert.strictEqual(errorMessage, 'invalid-reset-codeid')
    })
  })

  describe('errors', () => {
    it('invalid-csrf-token', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createResetCode(user)
      const req = TestHelper.createRequest(`/account/delete-reset-code?codeid=${user.resetCode.codeid}`)
      req.puppeteer = false
      req.account = user.account
      req.session = user.session
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
