/* eslint-env mocha */
const { faker } = require('@faker-js/faker')
const assert = require('assert')
const TestHelper = require('../../../test-helper.js')

describe('/account/create-profile', () => {
  describe('view', () => {
    it('should present the form', async () => {
      const user = await TestHelper.createUser()
      const req = TestHelper.createRequest('/account/create-profile')
      req.account = user.account
      req.session = user.session
      const result = await req.get()
      const doc = TestHelper.extractDoc(result.html)
      assert.strictEqual(doc.getElementById('submit-form').tag, 'form')
      assert.strictEqual(doc.getElementById('submit-button').tag, 'button')
    })

    it('should have elements for full-name', async () => {
      const user = await TestHelper.createUser()
      global.userProfileFields = ['full-name']
      const req = TestHelper.createRequest('/account/create-profile')
      req.account = user.account
      req.session = user.session
      const result = await req.get()
      const doc = TestHelper.extractDoc(result.html)
      const inputContainer = doc.getElementById('full-name-container')
      assert.strictEqual(inputContainer.tag, 'div')
    })

    it('should have elements for contact-email', async () => {
      const user = await TestHelper.createUser()
      global.userProfileFields = ['contact-email']
      const req = TestHelper.createRequest('/account/create-profile')
      req.account = user.account
      req.session = user.session
      const result = await req.get()
      const doc = TestHelper.extractDoc(result.html)
      const inputContainer = doc.getElementById('contact-email-container')
      assert.strictEqual(inputContainer.tag, 'fieldset')
    })

    it('should have elements for display-email', async () => {
      const user = await TestHelper.createUser()
      global.userProfileFields = ['display-email']
      const req = TestHelper.createRequest('/account/create-profile')
      req.account = user.account
      req.session = user.session
      const result = await req.get()
      const doc = TestHelper.extractDoc(result.html)
      const inputContainer = doc.getElementById('display-email-container')
      assert.strictEqual(inputContainer.tag, 'fieldset')
    })

    it('should have elements for dob', async () => {
      const user = await TestHelper.createUser()
      global.userProfileFields = ['dob']
      const req = TestHelper.createRequest('/account/create-profile')
      req.account = user.account
      req.session = user.session
      const result = await req.get()
      const doc = TestHelper.extractDoc(result.html)
      const inputContainer = doc.getElementById('dob-container')
      assert.strictEqual(inputContainer.tag, 'div')
    })

    it('should have elements for phone', async () => {
      const user = await TestHelper.createUser()
      global.userProfileFields = ['phone']
      const req = TestHelper.createRequest('/account/create-profile')
      req.account = user.account
      req.session = user.session
      const result = await req.get()
      const doc = TestHelper.extractDoc(result.html)
      const inputContainer = doc.getElementById('phone-container')
      assert.strictEqual(inputContainer.tag, 'fieldset')
    })

    it('should have elements for occupation', async () => {
      const user = await TestHelper.createUser()
      global.userProfileFields = ['occupation']

      const req = TestHelper.createRequest('/account/create-profile')
      req.account = user.account
      req.session = user.session
      const result = await req.get()
      const doc = TestHelper.extractDoc(result.html)
      const inputContainer = doc.getElementById('occupation-container')
      assert.strictEqual(inputContainer.tag, 'fieldset')
    })

    it('should have elements for location', async () => {
      const user = await TestHelper.createUser()
      global.userProfileFields = ['location']
      const req = TestHelper.createRequest('/account/create-profile')
      req.account = user.account
      req.session = user.session
      const result = await req.get()
      const doc = TestHelper.extractDoc(result.html)
      const inputContainer = doc.getElementById('location-container')
      assert.strictEqual(inputContainer.tag, 'fieldset')
    })

    it('should have elements for company-name', async () => {
      const user = await TestHelper.createUser()
      global.userProfileFields = ['company-name']
      const req = TestHelper.createRequest('/account/create-profile')
      req.account = user.account
      req.session = user.session
      const result = await req.get()
      const doc = TestHelper.extractDoc(result.html)
      const inputContainer = doc.getElementById('company-name-container')
      assert.strictEqual(inputContainer.tag, 'fieldset')
    })

    it('should have elements for website', async () => {
      const user = await TestHelper.createUser()
      global.userProfileFields = ['website']

      const req = TestHelper.createRequest('/account/create-profile')
      req.account = user.account
      req.session = user.session
      const result = await req.get()
      const doc = TestHelper.extractDoc(result.html)
      const inputContainer = doc.getElementById('website-container')
      assert.strictEqual(inputContainer.tag, 'fieldset')
    })
  })

  describe('submit', () => {
    it('should create profile (screenshots)', async () => {
      const user = await TestHelper.createUser()
      global.userProfileFields = ['full-name', 'display-name', 'contact-email', 'website']
      const req = TestHelper.createRequest('/account/create-profile')
      req.account = user.account
      req.session = user.session
      req.body = {
        'full-name': 'Test Person',
        'contact-email': 'test1@test.com',
        'display-name': 'tester',
        website: 'https://example.com',
        default: 'true'
      }
      req.filename = __filename
      req.screenshots = [
        { hover: '#account-menu-container' },
        { click: '/account' },
        { click: '/account/profiles' },
        { click: '/account/create-profile' },
        { fill: '#submit-form' }
      ]
      global.pageSize = 50
      const result = await req.post()
      const doc = TestHelper.extractDoc(result.html)
      const messageContainer = doc.getElementById('message-container')
      const message = messageContainer.child[0]
      assert.strictEqual(message.attr.template, 'success')
    })

    it('should create profile with full-name', async () => {
      const user = await TestHelper.createUser()
      global.userProfileFields = ['full-name']
      const req = TestHelper.createRequest('/account/create-profile')
      req.account = user.account
      req.session = user.session
      req.body = {
        'full-name': 'Test Person'
      }
      const result = await req.post()
      const doc = TestHelper.extractDoc(result.html)
      const messageContainer = doc.getElementById('message-container')
      const message = messageContainer.child[0]
      assert.strictEqual(message.attr.template, 'success')
    })

    it('should create profile and set default', async () => {
      const user = await TestHelper.createUser()
      global.userProfileFields = ['full-name']
      const req = TestHelper.createRequest('/account/create-profile')
      req.account = user.account
      req.session = user.session
      req.body = {
        'full-name': 'Test Person',
        default: 'true'
      }
      const result = await req.post()
      const doc = TestHelper.extractDoc(result.html)
      const messageContainer = doc.getElementById('message-container')
      const message = messageContainer.child[0]
      assert.strictEqual(message.attr.template, 'success')
    })

    it('should create profile with display name', async () => {
      global.userProfileFields = ['display-name']
      const user = await TestHelper.createUser()
      const req = TestHelper.createRequest('/account/create-profile')
      req.account = user.account
      req.session = user.session
      req.body = {
        'display-name': user.profile.fullName
      }
      const result = await req.post()
      const doc = TestHelper.extractDoc(result.html)
      const messageContainer = doc.getElementById('message-container')
      const message = messageContainer.child[0]
      assert.strictEqual(message.attr.template, 'success')
    })

    it('should create profile with contact-email', async () => {
      const user = await TestHelper.createUser()
      global.userProfileFields = ['contact-email']
      const req = TestHelper.createRequest('/account/create-profile')
      req.account = user.account
      req.session = user.session
      req.body = {
        'contact-email': user.profile.contactEmail
      }
      const result = await req.post()
      const doc = TestHelper.extractDoc(result.html)
      const messageContainer = doc.getElementById('message-container')
      const message = messageContainer.child[0]
      assert.strictEqual(message.attr.template, 'success')
    })

    it('should create profile with display-email', async () => {
      const user = await TestHelper.createUser()
      global.userProfileFields = ['display-email']
      const req = TestHelper.createRequest('/account/create-profile')
      req.account = user.account
      req.session = user.session
      req.body = {
        'display-email': user.profile.contactEmail
      }
      const result = await req.post()
      const doc = TestHelper.extractDoc(result.html)
      const messageContainer = doc.getElementById('message-container')
      const message = messageContainer.child[0]
      assert.strictEqual(message.attr.template, 'success')
    })

    it('should create profile with dob in YYYY-MM-DD', async () => {
      const user = await TestHelper.createUser()
      global.userProfileFields = ['dob']
      const req = TestHelper.createRequest('/account/create-profile')
      req.account = user.account
      req.session = user.session
      req.body = {
        dob: '2017-11-01'
      }
      const result = await req.post()
      const doc = TestHelper.extractDoc(result.html)
      const messageContainer = doc.getElementById('message-container')
      const message = messageContainer.child[0]
      assert.strictEqual(message.attr.template, 'success')
    })

    it('should create profile with dob in MM-DD-YYYY', async () => {
      const user = await TestHelper.createUser()
      global.userProfileFields = ['dob']
      const req = TestHelper.createRequest('/account/create-profile')
      req.account = user.account
      req.session = user.session
      req.body = {
        dob: '12-13-1968'
      }
      const result = await req.post()
      const doc = TestHelper.extractDoc(result.html)
      const messageContainer = doc.getElementById('message-container')
      const message = messageContainer.child[0]
      assert.strictEqual(message.attr.template, 'success')
    })

    it('should create profile with phone', async () => {
      const user = await TestHelper.createUser()
      global.userProfileFields = ['phone']
      const req = TestHelper.createRequest('/account/create-profile')
      req.account = user.account
      req.session = user.session
      req.body = {
        phone: faker.phone.number()
      }
      const result = await req.post()
      const doc = TestHelper.extractDoc(result.html)
      const messageContainer = doc.getElementById('message-container')
      const message = messageContainer.child[0]
      assert.strictEqual(message.attr.template, 'success')
    })

    it('should create profile with occupation', async () => {
      const user = await TestHelper.createUser()
      global.userProfileFields = ['occupation']
      const req = TestHelper.createRequest('/account/create-profile')
      req.account = user.account
      req.session = user.session
      req.body = {
        occupation: 'Teacher'
      }
      const result = await req.post()
      const doc = TestHelper.extractDoc(result.html)
      const messageContainer = doc.getElementById('message-container')
      const message = messageContainer.child[0]
      assert.strictEqual(message.attr.template, 'success')
    })

    it('should create profile with location', async () => {
      const user = await TestHelper.createUser()
      global.userProfileFields = ['location']
      const req = TestHelper.createRequest('/account/create-profile')
      req.account = user.account
      req.session = user.session
      req.body = {
        location: faker.address.city()
      }
      const result = await req.post()
      const doc = TestHelper.extractDoc(result.html)
      const messageContainer = doc.getElementById('message-container')
      const message = messageContainer.child[0]
      assert.strictEqual(message.attr.template, 'success')
    })

    it('should create profile with company-name', async () => {
      const user = await TestHelper.createUser()
      global.userProfileFields = ['company-name']
      const req = TestHelper.createRequest('/account/create-profile')
      req.account = user.account
      req.session = user.session
      req.body = {
        'company-name': faker.company.companyName()
      }
      const result = await req.post()
      const doc = TestHelper.extractDoc(result.html)
      const messageContainer = doc.getElementById('message-container')
      const message = messageContainer.child[0]
      assert.strictEqual(message.attr.template, 'success')
    })

    it('should create profile with website', async () => {
      const user = await TestHelper.createUser()
      global.userProfileFields = ['website']
      const req = TestHelper.createRequest('/account/create-profile')
      req.account = user.account
      req.session = user.session
      req.body = {
        website: faker.internet.domainName()
      }
      const result = await req.post()
      const doc = TestHelper.extractDoc(result.html)
      const messageContainer = doc.getElementById('message-container')
      const message = messageContainer.child[0]
      assert.strictEqual(message.attr.template, 'success')
    })
  })

  describe('errors', () => {
    it('invalid-full-name', async () => {
      const user = await TestHelper.createUser()
      global.userProfileFields = ['full-name']
      const req = TestHelper.createRequest('/account/create-profile')
      req.account = user.account
      req.session = user.session
      req.body = {
        'full-name': ''
      }
      const result = await req.post()
      const doc = TestHelper.extractDoc(result.html)
      const messageContainer = doc.getElementById('message-container')
      const message = messageContainer.child[0]
      assert.strictEqual(message.attr.template, 'invalid-full-name')
    })

    it('invalid-full-name-length', async () => {
      const user = await TestHelper.createUser()
      global.userProfileFields = ['full-name']
      const req = TestHelper.createRequest('/account/create-profile')
      req.account = user.account
      req.session = user.session
      req.body = {
        'full-name': '1'
      }
      global.minimumProfileFullNameLength = 10
      global.maximumProfileFullNameLength = 100
      const result = await req.post()
      const doc = TestHelper.extractDoc(result.html)
      const messageContainer = doc.getElementById('message-container')
      const message = messageContainer.child[0]
      assert.strictEqual(message.attr.template, 'invalid-full-name-length')
      global.minimumProfileFullNameLength = 1
      global.maximumProfileFullNameLength = 1
      req.body = {
        'full-name': '123456789'
      }
      const result2 = await req.post()
      const doc2 = TestHelper.extractDoc(result2.html)
      const messageContainer2 = doc2.getElementById('message-container')
      const message2 = messageContainer2.child[0]
      assert.strictEqual(message2.attr.template, 'invalid-full-name-length')
    })

    it('invalid-contact-email', async () => {
      const user = await TestHelper.createUser()
      global.userProfileFields = ['contact-email']
      const req = TestHelper.createRequest('/account/create-profile')
      req.account = user.account
      req.session = user.session
      req.body = {
        'contact-email': ''
      }
      const result = await req.post()
      const doc = TestHelper.extractDoc(result.html)
      const messageContainer = doc.getElementById('message-container')
      const message = messageContainer.child[0]
      assert.strictEqual(message.attr.template, 'invalid-contact-email')
      req.body = {
        'contact-email': 'invalid'
      }
      const result2 = await req.post()
      const doc2 = TestHelper.extractDoc(result2.html)
      const messageContainer2 = doc2.getElementById('message-container')
      const message2 = messageContainer2.child[0]
      assert.strictEqual(message2.attr.template, 'invalid-contact-email')
    })

    it('invalid-display-email', async () => {
      const user = await TestHelper.createUser()
      global.userProfileFields = ['display-email']
      const req = TestHelper.createRequest('/account/create-profile')
      req.account = user.account
      req.session = user.session
      req.body = {
        'display-email': ''
      }
      const result = await req.post()
      const doc = TestHelper.extractDoc(result.html)
      const messageContainer = doc.getElementById('message-container')
      const message = messageContainer.child[0]
      assert.strictEqual(message.attr.template, 'invalid-display-email')
      req.body = {
        'display-email': 'invalid'
      }
      const result2 = await req.post()
      const doc2 = TestHelper.extractDoc(result2.html)
      const messageContainer2 = doc2.getElementById('message-container')
      const message2 = messageContainer2.child[0]
      assert.strictEqual(message2.attr.template, 'invalid-display-email')
    })

    it('invalid-display-name', async () => {
      global.userProfileFields = ['display-name']
      const user = await TestHelper.createUser()
      const req = TestHelper.createRequest('/account/create-profile')
      req.account = user.account
      req.session = user.session
      req.body = {
        'display-name': ''
      }
      const result = await req.post()
      const doc = TestHelper.extractDoc(result.html)
      const messageContainer = doc.getElementById('message-container')
      const message = messageContainer.child[0]
      assert.strictEqual(message.attr.template, 'invalid-display-name')
    })

    it('invalid-display-name-length', async () => {
      global.userProfileFields = ['display-name']
      const user = await TestHelper.createUser()
      const req = TestHelper.createRequest('/account/create-profile')
      req.account = user.account
      req.session = user.session
      req.body = {
        'display-name': '1'
      }
      global.minimumProfileDisplayNameLength = 10
      global.maximumProfileDisplayNameLength = 100
      const result = await req.post()
      const doc = TestHelper.extractDoc(result.html)
      const messageContainer = doc.getElementById('message-container')
      const message = messageContainer.child[0]
      assert.strictEqual(message.attr.template, 'invalid-display-name-length')
      global.minimumProfileDisplayNameLength = 1
      global.maximumProfileDisplayNameLength = 1
      req.body = {
        'display-name': '123456789'
      }
      const result2 = await req.post()
      const doc2 = TestHelper.extractDoc(result2.html)
      const messageContainer2 = doc2.getElementById('message-container')
      const message2 = messageContainer2.child[0]
      assert.strictEqual(message2.attr.template, 'invalid-display-name-length')
    })

    it('invalid-dob', async () => {
      const user = await TestHelper.createUser()
      global.userProfileFields = ['dob']
      const req = TestHelper.createRequest('/account/create-profile')
      req.account = user.account
      req.session = user.session
      req.body = {
        dob: ''
      }
      const result = await req.post()
      const doc = TestHelper.extractDoc(result.html)
      const messageContainer = doc.getElementById('message-container')
      const message = messageContainer.child[0]
      assert.strictEqual(message.attr.template, 'invalid-dob')
      req.body = {
        dob: '2017-13-52'
      }
      const result2 = await req.post()
      const doc2 = TestHelper.extractDoc(result2.html)
      const messageContainer2 = doc2.getElementById('message-container')
      const message2 = messageContainer2.child[0]
      assert.strictEqual(message2.attr.template, 'invalid-dob')
    })

    it('invalid-phone', async () => {
      const user = await TestHelper.createUser()
      global.userProfileFields = ['phone']
      const req = TestHelper.createRequest('/account/create-profile')
      req.account = user.account
      req.session = user.session
      req.body = {
        phone: ''
      }
      const result = await req.post()
      const doc = TestHelper.extractDoc(result.html)
      const messageContainer = doc.getElementById('message-container')
      const message = messageContainer.child[0]
      assert.strictEqual(message.attr.template, 'invalid-phone')
    })

    it('invalid-occupation', async () => {
      const user = await TestHelper.createUser()
      global.userProfileFields = ['occupation']
      const req = TestHelper.createRequest('/account/create-profile')
      req.account = user.account
      req.session = user.session
      req.body = {
        occupation: ''
      }
      const result = await req.post()
      const doc = TestHelper.extractDoc(result.html)
      const messageContainer = doc.getElementById('message-container')
      const message = messageContainer.child[0]
      assert.strictEqual(message.attr.template, 'invalid-occupation')
    })

    it('invalid-location', async () => {
      const user = await TestHelper.createUser()
      global.userProfileFields = ['location']
      const req = TestHelper.createRequest('/account/create-profile')
      req.account = user.account
      req.session = user.session
      req.body = {
        location: ''
      }
      const result = await req.post()
      const doc = TestHelper.extractDoc(result.html)
      const messageContainer = doc.getElementById('message-container')
      const message = messageContainer.child[0]
      assert.strictEqual(message.attr.template, 'invalid-location')
    })

    it('invalid-company-name', async () => {
      const user = await TestHelper.createUser()
      global.userProfileFields = ['company-name']
      const req = TestHelper.createRequest('/account/create-profile')
      req.account = user.account
      req.session = user.session
      req.body = {
        'company-name': ''
      }
      const result = await req.post()
      const doc = TestHelper.extractDoc(result.html)
      const messageContainer = doc.getElementById('message-container')
      const message = messageContainer.child[0]
      assert.strictEqual(message.attr.template, 'invalid-company-name')
    })

    it('invalid-website', async () => {
      const user = await TestHelper.createUser()
      global.userProfileFields = ['website']
      const req = TestHelper.createRequest('/account/create-profile')
      req.account = user.account
      req.session = user.session
      req.body = {
        website: ''
      }
      const result = await req.post()
      const doc = TestHelper.extractDoc(result.html)
      const messageContainer = doc.getElementById('message-container')
      const message = messageContainer.child[0]
      assert.strictEqual(message.attr.template, 'invalid-website')
    })

    it('invalid-xss-input', async () => {
      const user = await TestHelper.createUser()
      global.userProfileFields = ['location']
      const req = TestHelper.createRequest('/account/create-profile')
      req.account = user.account
      req.session = user.session
      req.body = {
        location: '<script>'
      }
      const result = await req.post()
      const doc = TestHelper.extractDoc(result.html)
      const messageContainer = doc.getElementById('message-container')
      const message = messageContainer.child[0]
      assert.strictEqual(message.attr.template, 'invalid-xss-input')
    })

    it('invalid-csrf-token', async () => {
      const user = await TestHelper.createUser()
      global.userProfileFields = ['location']

      const req = TestHelper.createRequest('/account/create-profile')
      req.puppeteer = false
      req.account = user.account
      req.session = user.session
      req.body = {
        location: 'somewhere',
        'csrf-token': 'invalid'
      }
      const result = await req.post()
      const doc = TestHelper.extractDoc(result.html)
      const messageContainer = doc.getElementById('message-container')
      const message = messageContainer.child[0]
      assert.strictEqual(message.attr.template, 'invalid-csrf-token')
    })
  })
})
