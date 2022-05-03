// adds "novalidate" to form attributes so that the
// test-suite can verify the server error responses
// otherwise the forms won't submit with missing fields
const url = require('url')

module.exports = {
  page: setFormNoValidate,
  template: setFormNoValidate
}

function setFormNoValidate (req, _, doc) {
  if (process.NODE_ENV !== 'testing') {
    return
  }
  const forms = doc.getElementsByTagName('form')
  if (!forms || !forms.length) {
    return
  }
  for (const form of forms) {
    form.attr = form.attr || {}
    form.attr.method = form.attr.method || 'POST'
    form.attr.action = form.attr.action || req.url
    if (global.testNumber) {
      form.attr.novalidate = 'novalidate'
    }
    if (req.query && req.query['return-url']) {
      const formURL = form.attr.action.startsWith('/') ? global.dashboardServer + form.attr.action : form.attr.action
      const action = new url.URL(formURL)
      if (action['return-url']) {
        continue
      }
      const divider = form.attr.action.indexOf('?') > -1 ? '&' : '?'
      form.attr.action += `${divider}return-url=${encodeURI(req.query['return-url']).split('?').join('%3F').split('&').join('%26')}`
    }
  }
}
