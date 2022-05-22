const dashboard = require('../../../index.js')

module.exports = {
  get: renderPage,
  post: submitForm
}

function renderPage (req, res, messageTemplate) {
  messageTemplate = messageTemplate || (req.query ? req.query.message : null)
  const doc = dashboard.HTML.parse(req.html || req.route.html)
  if (messageTemplate) {
    dashboard.HTML.renderTemplate(doc, null, messageTemplate, 'message-container')
    if (req.removeContents || messageTemplate === 'success') {
      const submitForm = doc.getElementById('submit-form')
      submitForm.parentNode.removeChild(submitForm)
      return dashboard.Response.end(req, res, doc)
    }
  }
  const removeElements = [].concat(global.profileFields)
  const profileFields = req.userProfileFields || global.userProfileFields
  for (const field of profileFields) {
    removeElements.splice(removeElements.indexOf(field), 1)
  }
  for (const id of removeElements) {
    const element = doc.getElementById(`${id}-container`)
    element.parentNode.removeChild(element)
  }
  if (req.method === 'POST') {
    for (const field in req.body) {
      const element = doc.getElementById(field)
      if (!element) {
        continue
      }
      element.setAttribute('value', dashboard.Format.replaceQuotes(req.body[field]))
    }
  }
  return dashboard.Response.end(req, res, doc)
}

async function submitForm (req, res) {
  if (!req || !req.body) {
    return renderPage(req, res)
  }
  const profileFields = req.userProfileFields || global.userProfileFields
  for (const field of profileFields) {
    if (req.body[field] && req.body[field].trim) {
      req.body[field] = req.body[field].trim()
    }
    switch (field) {
      case 'full-name':
        if (req.body['full-name'] && req.body['full-name'].trim) {
          req.body['full-name'] = req.body['full-name'].trim()
        }
        if (!req.body['full-name'] || !req.body['full-name'].length) {
          return renderPage(req, res, 'invalid-full-name')
        }
        if (global.minimumProfileFullNameLength > req.body['full-name'].length ||
          global.maximumProfileFullNameLength < req.body['full-name'].length) {
          return renderPage(req, res, 'invalid-full-name-length')
        }
        continue
      case 'contact-email':
        if (!req.body[field] || req.body[field].indexOf('@') < 1) {
          return renderPage(req, res, `invalid-${field}`)
        }
        continue
      case 'display-email':
        if (!req.body[field] || req.body[field].indexOf('@') < 1) {
          return renderPage(req, res, `invalid-${field}`)
        }
        continue
      case 'display-name':
        if (!req.body[field] || !req.body[field].length) {
          return renderPage(req, res, `invalid-${field}`)
        }
        if (global.minimumProfileDisplayNameLength > req.body[field].length ||
          global.maximumProfileDisplayNameLength < req.body[field].length) {
          return renderPage(req, res, 'invalid-display-name-length')
        }
        continue
      case 'company-name':
        if (!req.body[field] || !req.body[field].length) {
          return renderPage(req, res, `invalid-${field}`)
        }
        if (global.minimumProfileCompanyNameLength > req.body[field].length ||
          global.maximumProfileCompanyNameLength < req.body[field].length) {
          return renderPage(req, res, 'invalid-company-name-length')
        }
        continue
      case 'dob':
        if (!req.body[field] || !req.body[field].length) {
          return renderPage(req, res, `invalid-${field}`)
        }
        try {
          const date = dashboard.Format.parseDate(req.body[field])
          if (!date || !date.getFullYear) {
            return renderPage(req, res, `invalid-${field}`)
          }
        } catch (error) {
          return renderPage(req, res, `invalid-${field}`)
        }
        continue
      default:
        if (!req.body || !req.body[field]) {
          return renderPage(req, res, `invalid-${field}`)
        }
        continue
    }
  }
  req.query = req.query || {}
  req.query.accountid = req.account.accountid
  try {
    await global.api.user.CreateProfile.post(req)
  } catch (error) {
    return renderPage(req, res, error.message)
  }
  if (req.query['return-url']) {
    return dashboard.Response.redirect(req, res, req.query['return-url'])
  }
  res.writeHead(302, {
    location: `${req.urlPath}?message=success`
  })
  return res.end()
}
