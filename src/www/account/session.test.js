/* eslint-env mocha */
const assert = require('assert')
const TestHelper = require('../../../test-helper.js')

describe('/account/session', () => {
  describe('before', () => {
    it('should bind data to req', async () => {
      const user = await TestHelper.createUser()
      const req = TestHelper.createRequest(`/account/session?sessionid=${user.session.sessionid}`)
      req.account = user.account
      req.session = user.session
      await req.route.api.before(req)
      assert.strictEqual(req.data.session.sessionid, user.session.sessionid)
    })
  })

  describe('view', () => {
    it('should present the session table (screenshots)', async () => {
      const user = await TestHelper.createUser()
      const req = TestHelper.createRequest(`/account/session?sessionid=${user.session.sessionid}`)
      req.account = user.account
      req.session = user.session
      req.filename = __filename
      req.screenshots = [
        { hover: '#account-menu-container' },
        { click: '/account' },
        { click: '/account/sessions' },
        { click: `/account/session?sessionid=${user.session.sessionid}` }
      ]
      global.pageSize = 50
      const result = await req.get()
      const doc = TestHelper.extractDoc(result.html)
      const tbody = doc.getElementById(req.session.sessionid)
      assert.strictEqual(tbody.tag, 'tbody')
    })
  })

  describe('errors', () => {
    it('invalid-sessionid', async () => {
      const user = await TestHelper.createUser()
      const req = TestHelper.createRequest('/account/end-session?sessionid=invalid')
      req.account = user.account
      req.session = user.session
      await req.route.api.before(req)
      assert.strictEqual(req.error, 'invalid-sessionid')
    })

    it('invalid-account', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createUser()
      const user2 = await TestHelper.createUser()
      const req = TestHelper.createRequest(`/account/end-session?sessionid=${user.session.sessionid}`)
      req.account = user2.account
      req.session = user2.session
      await req.route.api.before(req)
      assert.strictEqual(req.error, 'invalid-account')
    })
  })
})
