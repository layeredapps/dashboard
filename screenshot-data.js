const { faker } = require('@faker-js/faker')
const TestHelper = require('./test-helper.js')

const accountQuantities = []
const sessionQuantities = []
const resetCodeQuantities = []
const resetCodeUsages = []
const identities = []
let total = 0
for (let i = 0; i < 365; i++) {
  if (i === 0) {
    accountQuantities[i] = 100 + Math.ceil(Math.random() * 100)
  } else {
    accountQuantities[i] = Math.ceil(accountQuantities[i-1] * (0.85 + (Math.random() * 0.25)))
  }
  total += accountQuantities[i]
  sessionQuantities[i] = Math.ceil(accountQuantities[i] * (1 + (Math.random() * 0.8)))
  resetCodeQuantities[i] = Math.ceil(accountQuantities[i] * (0.25 * Math.random()))
  resetCodeUsages[i] = Math.ceil(resetCodeQuantities[i] * (0.25 * Math.random()))
}
for (let i = 0; i < total; i++) {
  identities[i] = TestHelper.nextIdentity()
}

const administratorIndex = {
  before: async (req) => {
    if (req.urlPath !== '/administrator') {
      return
    }
    const route = req.route
    const oldAPI = req.route.api
    req.route = {}
    for (const key in route) {
      req.route[key] = route[key] 
    }
    req.route.api = {
      before: oldAPI.before,
      get: oldAPI.get,
      post: oldAPI.post,
      patch: oldAPI.patch,
      put: oldAPI.put,
      delete: oldAPI.delete
    } 
    req.route.api.before = async (req) => {
      await oldAPI.before(req)
      addMetrics(req.data.accountsDays, 90, accountQuantities)
      addMetrics(req.data.sessionsDays, 90, sessionQuantities)
      addMetrics(req.data.resetCodesDays, 90, resetCodeQuantities)
      adjustNormalize(req.data.accountsDays)
      adjustNormalize(req.data.sessionsDays)
      adjustNormalize(req.data.resetCodesDays)
      adjustHighlight(accountQuantities, req.data.accountsHighlights)
      adjustHighlight(sessionQuantities, req.data.sessionsHighlights)
      adjustHighlight(resetCodeQuantities, req.data.resetCodesHighlights)
      adjustValues(req.data.accountsDays, req.data.accountsValues)
      adjustValues(req.data.sessionsDays, req.data.sessionsValues)
      adjustValues(req.data.resetCodesDays, req.data.resetCodesValues)
    }
  }
}

const administratorAccounts = {
  before: async (req) => {
    if (req.urlPath !== '/administrator/accounts' || global.pageSize !== 50) {
      return
    }
    const route = req.route
    const oldAPI = req.route.api
    req.route = {}
    for (const key in route) {
      req.route[key] = route[key] 
    }
    req.route.api = {
      before: oldAPI.before,
      get: oldAPI.get,
      post: oldAPI.post,
      patch: oldAPI.patch,
      put: oldAPI.put,
      delete: oldAPI.delete
    } 
    req.route.api.before = async (req) => {
      await oldAPI.before(req)
      addMetrics(req.data.createdChartDays, 365, accountQuantities)
      adjustNormalize(req.data.createdChartDays)
      adjustHighlight(accountQuantities, req.data.createdChartHighlights)
      adjustValues(req.data.createdChartDays, req.data.createdChartValues)
      addAccountObjects(req.data.accounts, global.pageSize - req.data.accounts.length)
      req.data.total = req.data.createdChartHighlights.total
    }
  }
}

const administratorResetCodes = {
  before: async (req) => {
    if (req.urlPath !== '/administrator/reset-codes' || global.pageSize !== 50) {
      return
    }
    const route = req.route
    const oldAPI = req.route.api
    req.route = {}
    for (const key in route) {
      req.route[key] = route[key] 
    }
    req.route.api = {
      before: oldAPI.before,
      get: oldAPI.get,
      post: oldAPI.post,
      patch: oldAPI.patch,
      put: oldAPI.put,
      delete: oldAPI.delete
    } 
    req.route.api.before = async (req) => {
      await oldAPI.before(req)
      addMetrics(req.data.createdChartDays, 365, accountQuantities)
      adjustNormalize(req.data.createdChartDays)
      adjustHighlight(accountQuantities, req.data.createdChartHighlights)
      adjustValues(req.data.createdChartDays, req.data.createdChartValues)
      addResetCodeObjects(req.data.resetCodes, global.pageSize - req.data.resetCodes.length)
      req.data.total = req.data.createdChartHighlights.total
    }
  }
}

const administratorSessions = {
  before: async (req) => {
    if (req.urlPath !== '/administrator/sessions' || global.pageSize !== 50) {
      return
    }
    const route = req.route
    const oldAPI = req.route.api
    req.route = {}
    for (const key in route) {
      req.route[key] = route[key] 
    }
    req.route.api = {
      before: oldAPI.before,
      get: oldAPI.get,
      post: oldAPI.post,
      patch: oldAPI.patch,
      put: oldAPI.put,
      delete: oldAPI.delete
    } 
    req.route.api.before = async (req) => {
      await oldAPI.before(req)
      addMetrics(req.data.createdChartDays, 365, accountQuantities)
      adjustNormalize(req.data.createdChartDays)
      adjustHighlight(accountQuantities, req.data.createdChartHighlights)
      adjustValues(req.data.createdChartDays, req.data.createdChartValues)
      addSessionObjects(req.data.sessions, global.pageSize - req.data.sessions.length)
      req.data.total = req.data.createdChartHighlights.total
    }
  }
}

const administratorProfiles = {
  before: async (req) => {
    if (req.urlPath !== '/administrator/profiles' || global.pageSize !== 50) {
      return
    }
    const route = req.route
    const oldAPI = req.route.api
    req.route = {}
    for (const key in route) {
      req.route[key] = route[key] 
    }
    req.route.api = {
      before: oldAPI.before,
      get: oldAPI.get,
      post: oldAPI.post,
      patch: oldAPI.patch,
      put: oldAPI.put,
      delete: oldAPI.delete
    } 
    req.route.api.before = async (req) => {
      await oldAPI.before(req)
      // addMetrics(req.data.createdChartDays, 365, accountQuantities)
      // adjustNormalize(req.data.createdChartDays)
      // adjustHighlight(accountQuantities, req.data.createdChartHighlights)
      // adjustValues(req.data.createdChartDays, req.data.createdChartValues)
      addProfileObjects(req.data.profiles, global.pageSize - req.data.profiles.length)
      req.data.total += global.pageSize - req.data.profiles.length
    }
  }
}

module.exports = {
  administratorAccounts,
  administratorIndex,
  administratorProfiles,
  administratorResetCodes,
  administratorSessions
}

function addAccountObjects(array, quantity) {
  const now = new Date()
  let date = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  let day = 0
  let dayCount = 0
  let identityNumber = 0
  for (let i = 0; i < quantity; i++) {
    dayCount++
    if (dayCount == accountQuantities[day]) {
      day++
      dayCount = 0
      date = new Date(now.getFullYear(), now.getMonth(), now.getDate() - day)
    }
    const identity = identities[identityNumber]
    identityNumber++
    const account = {
      accountid: 'acct_' + faker.datatype.uuid().split('-').join('').substring(0, 16),
      object: 'account',
      appid: global.appid,
      profileid: 'prof_' + faker.datatype.uuid().split('-').join('').substring(0, 16),
      sessionKeyNumber: 1,
      lastSignedInAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
      createdAtFormatted: date.getFullYear() + '-' + twoDigits(date.getMonth() + 1) + '-' + twoDigits(date.getDate()),
      lastSignedInAtFormatted: date.getFullYear() + '-' + twoDigits(date.getMonth() + 1) + '-' + twoDigits(date.getDate()),
      contactEmail: identity.email,
      firstName: identity.firstName,
      lastName: identity.lastName
    }
    array.push(account)
  }
}

function addSessionObjects (array, quantity) {
  const now = new Date()
  let date = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  let day = 0
  let dayCount = 0
  let identityNumber = 0
  for (let i = 0; i < quantity; i++) {
    dayCount++
    if (dayCount == accountQuantities[day]) {
      day++
      dayCount = 0
      date = new Date(now.getFullYear(), now.getMonth(), now.getDate() - day)
    }
    const identity = identities[identityNumber]
    identityNumber++
    const session = {
      sessionid: 'sess_' + faker.datatype.uuid().split('-').join('').substring(0, 16),
      object: 'session',
      appid: global.appid,
      accountid: 'acct_' + faker.datatype.uuid().split('-').join('').substring(0, 16),
      duration: Math.random() < 0.5 ? 1200 : 12000,
      expiresAt: now,
      lastVerifiedAt: date,
      ended: Math.random() < 0.5 ? date : undefined,
      createdAt: date,
      updatedAt: date,
      contactEmail: identity.email,
      firstName: identity.firstName,
      lastName: identity.lastName
    }
    array.push(session)
  }
}

function addResetCodeObjects (array, quantity) {
  const now = new Date()
  let date = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  let day = 0
  let dayCount = 0
  for (let i = 0; i < quantity; i++) {
    dayCount++
    if (dayCount == accountQuantities[day]) {
      day++
      dayCount = 0
      date = new Date(now.getFullYear(), now.getMonth(), now.getDate() - day)
    }
    const account = {
      codeid: 'code_' + faker.datatype.uuid().split('-').join('').substring(0, 16),
      object: 'resetCode',
      appid: global.appid,
      accountid: 'acct_' + faker.datatype.uuid().split('-').join('').substring(0, 16),
      createdAt: new Date(),
      updatedAt: new Date()
    }
    array.push(account)
  }
}

function addProfileObjects(array, quantity) {
  const now = new Date()
  let date = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  let day = 0
  let dayCount = 0
  let identityNumber = 0
  for (let i = 0; i < quantity; i++) {
    dayCount++
    if (dayCount == accountQuantities[day]) {
      day++
      dayCount = 0
      date = new Date(now.getFullYear(), now.getMonth(), now.getDate() - day)
    }
    const identity = identities[identityNumber]
    identityNumber++
    const profile = {
      accountid: 'acct_' + faker.datatype.uuid().split('-').join('').substring(0, 16),
      object: 'profile',
      appid: global.appid,
      profileid: 'prof_' + faker.datatype.uuid().split('-').join('').substring(0, 16),
      createdAt: new Date(),
      updatedAt: new Date(),
      createdAtFormatted: date.getFullYear() + '-' + twoDigits(date.getMonth() + 1) + '-' + twoDigits(date.getDate()),
      contactEmail: identity.email,
      firstName: identity.firstName,
      lastName: identity.lastName
    }
    array.push(profile)
  }
}

function addMetrics (array, days, quantities) {
  const now = new Date()
  for (let i = 0; i < days; i++) {
    const date = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i)
    const dayQuantity = quantities[i]
    array[i] = {
      value: dayQuantity,
      dateKey: date.getFullYear() + '-' + twoDigits(date.getMonth() + 1) + '-' + twoDigits(date.getDate()),
      object: 'metric'
    }
  }
}

function adjustHighlight (array, highlights) {
  highlights.today = 0
  highlights.yesterday = 0
  highlights.last7Days = 0
  highlights.last30Days = 0
  highlights.last90Days = 0
  highlights.total = 0
  for (let i = 0; i < array.length; i++) {
    const dayQuantity = array[i]
    highlights.total += dayQuantity
    if (i < 90) {
      highlights.last90Days += dayQuantity
      if (i < 30) {
        highlights.last30Days += dayQuantity
        if (i < 7) {
          highlights.last7Days += dayQuantity
          if (i === 1) {
            highlights.yesterday += dayQuantity
          }
          if (i === 0) {
            highlights.today += dayQuantity
          }
        }
      }
    }
  }
}

function adjustValues (array, values) {
  let maximum = 0
  for (const object of array) {
    if (object.value > maximum) {
      maximum = object.value
    }
  }
  values[0] = { object: 'object', value: maximum }
  values[1] = { object: 'object', value: Math.floor(maximum * 0.75) }
  values[2] = { object: 'object', value: Math.floor(maximum * 0.5) }
  values[3] = { object: 'object', value: Math.floor(maximum * 0.25) }
}

function adjustNormalize (array) {
  let maximum = 0
  for (const object of array) {
    if (object.value > maximum) {
      maximum = object.value
    }
  }
  for (const object of array) {
    object.normalized = Math.floor(object.value / maximum * 100)
    object.top = 100 - object.normalized
  }
}

function twoDigits (n) {
  if (n < 10) {
    return `0${n}`
  }
  return n.toString()
}