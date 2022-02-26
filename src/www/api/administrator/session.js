const dashboard = require('../../../../index.js')

module.exports = {
  get: async (req) => {
    if (!req.query || !req.query.sessionid) {
      throw new Error('invalid-sessionid')
    }
    let session = await dashboard.StorageCache.get(req.query.sessionid)
    if (!session) {
      let sessionInfo
      try {
        sessionInfo = await dashboard.Storage.Session.findOne({
          where: {
            sessionid: req.query.sessionid
          }
        })
      } catch (error) {
      }
      if (!sessionInfo) {
        throw new Error('invalid-sessionid')
      }
      session = {}
      for (const field of sessionInfo._options.attributes) {
        session[field] = sessionInfo.get(field)
      }
      await dashboard.StorageCache.set(req.query.sessionid, session)
    }
    delete (session.tokenHash)
    if (!session.ended) {
      const query = req.query
      req.query.accountid = session.accountid
      const account = await global.api.administrator.Account.get(req)
      req.query = query
      if (session.sessionKeyNumber < account.sessionKeyNumber) {
        session.ended = account.sessionKeyLastResetAt
      } else if (new Date(session.expiresAt).getTime() <= new Date().getTime()) {
        session.ended = session.expiresAt
      }
    }
    return session
  }
}
