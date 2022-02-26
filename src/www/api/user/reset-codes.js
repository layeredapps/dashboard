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
    let codeids
    if (req.query.all) {
      codeids = await dashboard.Storage.ResetCode.findAll({
        where: {
          accountid: req.query.accountid
        },
        attributes: ['codeid'],
        order: [
          ['createdAt', 'DESC']
        ]
      })
    } else {
      const offset = req.query.offset ? parseInt(req.query.offset, 10) : 0
      const limit = req.query.limit ? parseInt(req.query.limit, 10) : global.pageSize
      codeids = await dashboard.Storage.ResetCode.findAll({
        where: {
          accountid: req.query.accountid
        },
        offset,
        limit,
        attributes: ['codeid'],
        order: [
          ['createdAt', 'DESC']
        ]
      })
    }
    const resetCodes = []
    for (const codeData of codeids) {
      req.query.codeid = codeData.dataValues.codeid
      const resetCode = await global.api.user.ResetCode.get(req)
      resetCodes.push(resetCode)
    }
    return resetCodes
  }
}
