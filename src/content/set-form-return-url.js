// takes the 'return-url' from the url params and
// adds it to any forms if they do not specify a
// return-url

module.exports = {
  page: insertReturnURL,
  template: insertReturnURL
}

function insertReturnURL (req, _, doc) {
  if (!req.query || !req.query['return-url']) {
    return
  }
  const forms = doc.getElementsByTagName('form')
  if (!forms || !forms.length) {
    return
  }
  for (const form of forms) {
    if (!form.attr || !form.attr.action) {
      return
    }
    const formURL = form.attr.action.startsWith('/') ? global.dashboardServer + form.attr.action : form.attr.action
    const action = new url.URL(formURL)
    if (action['return-url']) {
      continue
    }
    const divider = form.attr.action.indexOf('?') > -1 ? '&' : '?'
    form.attr.action += `${divider}return-url=${encodeURI(req.query['return-url']).split('?').join('%3F').split('&').join('%26')}`
  }
}
