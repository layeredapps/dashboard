/* eslint-env mocha */
const assert = require('assert')
const TestHelper = require('../../../test-helper.js')

describe('/account/set-default-profile', () => {
  describe('before', () => {
    it('should bind data to req', async () => {
      const user = await TestHelper.createUser()
      const profile1 = user.profile
      await TestHelper.createProfile(user, {
        'first-name': user.profile.firstName,
        'last-name': user.profile.lastName,
        'contact-email': user.profile.contactEmail,
        default: 'true'
      })
      const req = TestHelper.createRequest(`/account/set-default-profile?profileid=${profile1.profileid}`)
      req.account = user.account
      req.session = user.session
      await req.route.api.before(req)
      assert.strictEqual(req.data.profile.profileid, profile1.profileid)
    })
  })

  describe('view', () => {
    it('should present the form', async () => {
      const user = await TestHelper.createUser()
      const profile1 = user.profile
      await TestHelper.createProfile(user, {
        'first-name': user.profile.firstName,
        'last-name': user.profile.lastName,
        'contact-email': user.profile.contactEmail,
        default: 'true'
      })
      const req = TestHelper.createRequest(`/account/set-default-profile?profileid=${profile1.profileid}`)
      req.account = user.account
      req.session = user.session
      const result = await req.get()
      const doc = TestHelper.extractDoc(result.html)
      assert.strictEqual(doc.getElementById('submit-form').tag, 'form')
      assert.strictEqual(doc.getElementById('submit-button').tag, 'button')
    })
  })

  describe('submit', () => {
    it('should set the profile as default (screenshots)', async () => {
      const user = await TestHelper.createUser()
      const profile1 = user.profile
      await TestHelper.createProfile(user, {
        'first-name': user.profile.firstName,
        'last-name': user.profile.lastName,
        'contact-email': TestHelper.nextIdentity().email,
        default: 'true'
      })
      const req = TestHelper.createRequest(`/account/set-default-profile?profileid=${profile1.profileid}`)
      req.account = user.account
      req.session = user.session
      req.filename = __filename
      req.screenshots = [
        { hover: '#account-menu-container' },
        { click: '/account' },
        { click: '/account/profiles' },
        { click: `/account/profile?profileid=${profile1.profileid}` },
        { click: `/account/set-default-profile?profileid=${profile1.profileid}` },
        { fill: '#submit-form' }
      ]
      global.pageSize = 50
      const result = await req.post()
      const doc = TestHelper.extractDoc(result.html)
      const messageContainer = doc.getElementById('message-container')
      const message = messageContainer.child[0]
      assert.strictEqual(message.attr.template, 'success')
    })
  })

  describe('errors', () => {
    it('invalid-profileid', async () => {
      const user = await TestHelper.createUser()
      const req = TestHelper.createRequest('/account/set-default-profile?profileid=invalid')
      req.account = user.account
      req.session = user.session
      await req.route.api.before(req)
      assert.strictEqual(req.error, 'invalid-profileid')
    })

    it('invalid-account', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createUser()
      const user2 = await TestHelper.createUser()
      const req = TestHelper.createRequest(`/account/set-default-profile?profileid=${user.profile.profileid}`)
      req.account = user2.account
      req.session = user2.session
      await req.route.api.before(req)
      assert.strictEqual(req.error, 'invalid-account')
    })

    it('invalid-csrf-token', async () => {
      const user = await TestHelper.createUser()
      const profile1 = user.profile
      await TestHelper.createProfile(user, {
        'first-name': user.profile.firstName,
        'last-name': user.profile.lastName,
        'contact-email': TestHelper.nextIdentity().email,
        default: 'true'
      })
      const req = TestHelper.createRequest(`/account/set-default-profile?profileid=${profile1.profileid}`)
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
