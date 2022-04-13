const metrics = require('../../../metrics.js')

module.exports = {
  get: async (req) => {
    if (!req.query || !req.query.keys) {
      throw new Error('invalid-keys')
    }
    const keys = req.query.keys.split(',')
    for (const key of keys) {
      if (key.indexOf('/') === -1) {
        throw new Error('invalid-key')
      }
      if (!key.endsWith('/total') && key.indexOf('-') === -1) {
        throw new Error('invalid-key')
      }
      if (key.endsWith('/total')) {
        continue
      }
      const dateParts = key.split('/')[1].split('-')
      const year = dateParts[0]
      if (year.length !== 4) {
        throw new Error('invalid-key')
      }
      try {
        const yearInt = parseInt(year, 10)
        if (yearInt.toString() !== year) {
          throw new Error('invalid-key')
        }
      } catch (error) {
        throw new Error('invalid-key')
      }
      if (dateParts.length > 1) {
        const month = dateParts[1]
        if (month.length !== 2) {
          throw new Error('invalid-key')
        }
        try {
          const monthInt = parseInt(month, 10)
          if (monthInt.toString() !== month && `0${monthInt}` !== month) {
            throw new Error('invalid-key')
          }
          if (monthInt < 1 || monthInt > 12) {
            throw new Error('invalid-key')
          }
        } catch (error) {
          throw new Error('invalid-key')
        }
        if (dateParts.length > 2) {
          const day = dateParts[2]
          if (day.length !== 2) {
            throw new Error('invalid-key')
          }
          try {
            const dayInt = parseInt(day, 10)
            if (dayInt.toString() !== day && `0${dayInt}` !== day) {
              throw new Error('invalid-key')
            }
            if (dayInt < 1 || dayInt > 31) {
              throw new Error('invalid-key')
            }
          } catch (error) {
            throw new Error('invalid-key')
          }
        }
        if (dateParts.length > 3) {
          throw new Error('invalid-key')
        }
      }
    }
    return metrics.keyRange(keys)
  }
}
