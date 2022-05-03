const xssFilters = require('xss-filters')
const validator = require('validator')

module.exports = {
  emailAddress,
  xssCheck
}

function emailAddress (value) {
  return validator.isEmail(value)
}

function xssCheck (object) {
  for (const key in object) {
    const value = object[key]
    const checked = xssFilters.inHTMLData(value)
    if (checked !== value) {
      return false
    }
  }
  return true
}
