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
            sessionid: req.query.sessionid,
            appid: req.appid || global.appid
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
    if (session.accountid !== req.account.accountid) {
      throw new Error('invalid-account')
    }
    delete (session.tokenHash)
    if (!session.ended) {
      if (session.sessionKeyNumber < req.account.sessionKeyNumber) {
        session.ended = req.account.sessionKeyLastResetAt
      } else if (new Date(session.expiresAt).getTime() <= new Date().getTime()) {
        session.ended = session.expiresAt
      }
    }
    return session
  }
}
