const xssFilters = require('xss-filters')

module.exports = {
  urlParamsXSS,
  requestBodyXSS,
  xssCheck
}

function urlParamsXSS (query) {
  for (const field in query) {
    const checked = xssFilters.inHTMLData(query[field])
    if (checked !== query[field]) {
      throw new Error(`invalid-${field}`)
    }
  }
}

function requestBodyXSS (body) {
  for (const field in body) {
    const checked = xssFilters.inHTMLData(body[field])
    if (checked !== body[field]) {
      throw new Error(`invalid-${field}`)
    }
  }
}

function xssCheck (value) {
  const checked = xssFilters.inHTMLData(value)
  if (checked !== xssCheck) {
    return false
  }
}
