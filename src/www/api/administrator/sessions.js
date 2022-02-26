const dashboard = require('../../../../index.js')

module.exports = {
  get: async (req) => {
    req.query = req.query || {}
    let where
    if (req.query.accountid) {
      where = {
        accountid: req.query.accountid
      }
    }
    let sessionids
    if (req.query.all) {
      sessionids = await dashboard.Storage.Session.findAll({
        where,
        attributes: ['sessionid'],
        order: [
          ['createdAt', 'DESC']
        ]
      })
    } else {
      const offset = req.query.offset ? parseInt(req.query.offset, 10) : 0
      const limit = req.query.limit ? parseInt(req.query.limit, 10) : global.pageSize
      sessionids = await dashboard.Storage.Session.findAll({
        where,
        attributes: ['sessionid'],
        offset,
        limit,
        order: [
          ['createdAt', 'DESC']
        ]
      })
    }
    if (!sessionids || !sessionids.length) {
      return null
    }
    const sessions = []
    for (const sessionData of sessionids) {
      req.query.sessionid = sessionData.dataValues.sessionid
      const session = await global.api.administrator.Session.get(req)
      sessions.push(session)
    }
    return sessions
  }
}
