const dashboard = require('../../../../index.js')

module.exports = {
  get: async (req) => {
    if (!req.query || !req.query.accountid) {
      throw new Error('invalid-accountid')
    }
    const account = await global.api.user.Account.get(req)
    if (!account) {
      throw new Error('invalid-accountid')
    }
    let sessionids
    if (req.query.all) {
      sessionids = await dashboard.Storage.Session.findAll({
        where: {
          accountid: req.query.accountid,
          appid: req.appid || global.appid
        },
        attributes: ['sessionid'],
        order: [
          ['createdAt', 'DESC']
        ]
      })
    } else {
      const offset = req.query.offset ? parseInt(req.query.offset, 10) : 0
      const limit = req.query.limit ? parseInt(req.query.limit, 10) : global.pageSize
      sessionids = await dashboard.Storage.Session.findAll({
        where: {
          accountid: req.query.accountid,
          appid: req.appid || global.appid
        },
        offset,
        limit,
        attributes: ['sessionid'],
        order: [
          ['createdAt', 'DESC']
        ]
      })
    }
    const sessions = []
    for (const sessionData of sessionids) {
      req.query.sessionid = sessionData.dataValues.sessionid
      const session = await global.api.user.Session.get(req)
      sessions.push(session)
    }
    return sessions
  }
}
