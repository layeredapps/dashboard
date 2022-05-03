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
  for (const value of object) {
    const checked = xssFilters.inHTMLData(value)
    if (checked !== value) {
      return false
    }
  }
  return true
}
