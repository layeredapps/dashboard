/* eslint-env mocha */
const assert = require('assert')
const insertCSRFToken = require('./insert-csrf-token.js')
const TestHelper = require('../../test-helper.js')

describe('content/insert-csrf-token', () => {
  describe('page', () => {
    it('should add CSRF token to input[name=csrf-token]', async () => {
      const user = await TestHelper.createUser()
      const req = TestHelper.createRequest('/account/change-username')
      req.account = user.account
      req.session = user.session
      const doc = TestHelper.extractDoc(req.route.html)
      const inputsBefore = doc.getElementsByTagName('input')
      let input
      for (const candidate of inputsBefore) {
        if (candidate.attr && candidate.attr.name === 'csrf-token') {
          input = candidate
          break
        }
      }
      assert.strictEqual(input.tag, 'input')
      assert.strictEqual(input.attr.name, 'csrf-token')
      assert.strictEqual(input.attr.value, undefined)
      await insertCSRFToken.page(req, null, doc)
      const inputsAfter = doc.getElementsByTagName('input')
      let final
      for (const candidate of inputsAfter) {
        if (candidate.attr && candidate.attr.name === 'csrf-token') {
          final = candidate
          break
        }
      }
      assert.strictEqual(final.tag, 'input')
      assert.strictEqual(final.attr.name, 'csrf-token')
      assert.strictEqual(final.attr.value.length > 0, true)
    })
  })

  describe('template', () => {
    it('should add CSRF token to input[name=csrf-token]', async () => {
      const user = await TestHelper.createUser()
      const req = TestHelper.createRequest('/account/change-username')
      req.account = user.account
      req.session = user.session
      const doc = TestHelper.extractDoc(req.route.html)
      const inputsBefore = doc.getElementsByTagName('input')
      let input
      for (const candidate of inputsBefore) {
        if (candidate.attr && candidate.attr.name === 'csrf-token') {
          input = candidate
          break
        }
      }
      assert.strictEqual(input.tag, 'input')
      assert.strictEqual(input.attr.name, 'csrf-token')
      assert.strictEqual(input.attr.value, undefined)
      await insertCSRFToken.template(req, null, doc)
      const inputsAfter = doc.getElementsByTagName('input')
      let final
      for (const candidate of inputsAfter) {
        if (candidate.attr && candidate.attr.name === 'csrf-token') {
          final = candidate
          break
        }
      }
      assert.strictEqual(final.tag, 'input')
      assert.strictEqual(final.attr.name, 'csrf-token')
      assert.strictEqual(final.attr.value.length > 0, true)
    })
  })
})
