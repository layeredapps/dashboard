const dashboard = require('../../../index.js')

module.exports = {
  before: beforeRequest,
  get: renderPage
}

async function beforeRequest (req) {
  const total = await global.api.administrator.AdministratorAccountsCount.get(req)
  const administrators = await global.api.administrator.AdministratorAccounts.get(req)
  if (administrators && administrators.length) {
    req.query = req.query || {}
    for (const administrator of administrators) {
      administrator.createdAtFormatted = dashboard.Format.date(administrator.createdAt)
      administrator.administratorFormatted = dashboard.Format.date(administrator.administrator)
      administrator.lastSignedInAtFormatted = administrator.lastSignedInAt ? dashboard.Format.date(administrator.lastSignedInAt) : '-'
      if (administrator.profileid) {
        req.query.profileid = administrator.profileid
        const profile = await global.api.administrator.Profile.get(req)
        administrator.contactEmail = profile.contactEmail
        administrator.fullName = profile.fullName
      } else {
        administrator.contactEmail = '-'
        administrator.fullName = '-'
      }
    }
  }
  const offset = req.query ? req.query.offset || 0 : 0
  req.data = { administrators, total, offset }
}

async function renderPage (req, res) {
  const doc = dashboard.HTML.parse(req.html || req.route.html)
  if (req.data.administrators && req.data.administrators.length) {
    dashboard.HTML.renderTable(doc, req.data.administrators, 'administrator-row', 'administrators-table')
    if (req.data.total <= global.pageSize) {
      const pageLinks = doc.getElementById('page-links')
      pageLinks.parentNode.removeChild(pageLinks)
    } else {
      dashboard.HTML.renderPagination(doc, req.data.offset, req.data.total)
    }
    const noAdministrators = doc.getElementById('no-administrators')
    noAdministrators.parentNode.removeChild(noAdministrators)
  } else {
    const administratorsTable = doc.getElementById('administrators-table')
    administratorsTable.parentNode.removeChild(administratorsTable)
  }
  return dashboard.Response.end(req, res, doc)
}
