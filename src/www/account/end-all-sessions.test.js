/* eslint-env mocha */
const assert = require('assert')
const dashboard = require('../../../index.js')
const TestHelper = require('../../../test-helper.js')

describe('/account/end-all-sessions', () => {
  describe('view', () => {
    it('should present the form', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createResetCode(user)
      const req = TestHelper.createRequest('/account/end-all-sessions')
      req.account = user.account
      req.session = user.session
      const result = await req.get()
      const doc = TestHelper.extractDoc(result.html)
      assert.strictEqual(doc.getElementById('submit-form').tag, 'form')
      assert.strictEqual(doc.getElementById('submit-button').tag, 'button')
    })
  })

  describe('submit', () => {
    it('should generate a new session key (screenshots)', async () => {
      const user = await TestHelper.createUser()
      const previous = await dashboard.Storage.Account.findOne({
        where: {
          accountid: user.account.accountid
        }
      })
      const req = TestHelper.createRequest('/account/end-all-sessions')
      req.account = user.account
      req.session = user.session
      req.filename = __filename
      req.screenshots = [
        { hover: '#account-menu-container' },
        { click: '/account' },
        { click: '/account/end-all-sessions' },
        { fill: '#submit-form' }
      ]
      global.pageSize = 50
      const result = await req.post()
      assert.strictEqual(result.redirect, '/account/signin?return-url=/home')
      const current = await dashboard.Storage.Account.findOne({
        where: {
          accountid: user.account.accountid
        }
      })
      assert.notStrictEqual(current.dataValues.sessionKey, previous.dataValues.sessionKey)
    })
  })

  describe('errors', () => {
    it('invalid-csrf-token', async () => {
      const user = await TestHelper.createUser()
      const req = TestHelper.createRequest('/account/end-all-sessions')
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
