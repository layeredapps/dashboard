const dashboard = require('../../../../index.js')

module.exports = {
  get: async (req) => {
    if (!req.query || !req.query.codeid) {
      throw new Error('invalid-reset-codeid')
    }
    let code = await dashboard.StorageCache.get(req.query.codeid)
    if (!code) {
      let codeInfo
      try {
        codeInfo = await dashboard.Storage.ResetCode.findOne({
          where: {
            codeid: req.query.codeid
          }
        })
      } catch (error) {
      }
      if (!codeInfo) {
        throw new Error('invalid-reset-codeid')
      }
      code = {}
      for (const field of codeInfo._options.attributes) {
        code[field] = codeInfo.get(field)
      }
      await dashboard.StorageCache.set(req.query.codeid, code)
    }
    delete (code.secretCodeHash)
    return code
  }
}
