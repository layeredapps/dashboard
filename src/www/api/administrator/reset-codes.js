const dashboard = require('../../../../index.js')

module.exports = {
  get: async (req) => {
    req.query = req.query || {}
    const where = {
      appid: req.appid || global.appid
    }
    if (req.query.accountid) {
      where.accountid = req.query.accountid
    }
    let codeids
    if (req.query.all) {
      codeids = await dashboard.Storage.ResetCode.findAll({
        attributes: ['codeid'],
        where,
        order: [
          ['createdAt', 'DESC']
        ]
      })
    } else {
      const offset = req.query.offset ? parseInt(req.query.offset, 10) : 0
      const limit = req.query.limit ? parseInt(req.query.limit, 10) : global.pageSize
      codeids = await dashboard.Storage.ResetCode.findAll({
        attributes: ['codeid'],
        where,
        offset,
        limit,
        order: [
          ['createdAt', 'DESC']
        ]
      })
    }
    if (!codeids || !codeids.length) {
      return null
    }
    const resetCodes = []
    for (const codeData of codeids) {
      req.query.codeid = codeData.dataValues.codeid
      const resetCode = await global.api.administrator.ResetCode.get(req)
      resetCodes.push(resetCode)
    }
    return resetCodes
  }
}
