// This code suppresses the console when not required.  To override the
// log method with your own logging make a /log.js in your project that
// exports your alternative.
//
// This script can allow logging by setting an ENV variable:
// $ LOG_LEVEL=desired,level,list node main.js

const fs = require('fs')

if (fs.existsSync(`${global.applicationPath}/log.js`)) {
  module.exports = require(`${global.applicationPath}/log.js`)
} else {
  const noop = function () { }
  module.exports = (prefix) => {
    const logger = {}
    const levels = ['info', 'error', 'log']
    for (const level of levels) {
      logger[level] = noop
    }
    if (!process.env.LOG_LEVEL) {
      return logger
    }
    const allowedLevels = process.env.LOG_LEVEL.split(',')
    const excludePrefix = (process.env.LOG_EXCLUDE || '').split(',')
    if (excludePrefix.indexOf(prefix) > -1) {
      return logger
    }
    for (const level of allowedLevels) {
      if (!logger[level] || !console[level]) {
        continue
      }
      logger[level] = (...args) => {
        console[level](`[${Math.floor(new Date().getTime() / 1000)}-${prefix}]`, ...args)
      }
    }
    return logger
  }
}
