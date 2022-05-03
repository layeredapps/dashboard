// adds "novalidate" to form attributes so that the
// test-suite can verify the server error responses
// otherwise the forms won't submit with missing fields
module.exports = {
  page: setFormNoValidate,
  template: setFormNoValidate
}

function setFormNoValidate (req, _, doc) {
  if (process.env.NODE_ENV !== 'testing') {
    return
  }
  const forms = doc.getElementsByTagName('form')
  if (!forms || !forms.length) {
    return
  }
  for (const form of forms) {
    form.attr = form.attr || {}
    form.attr.novalidate = 'novalidate'
  }
}
