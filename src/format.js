const HRNumbers = require('human-readable-numbers')

module.exports = {
  replaceQuotes,
  parseDate,
  date,
  money,
  number
}

/**
 * Replaces ' and " with &apos; and &quot; so HTML fields don't get
 * posted values rendered in a broken way
 * @param {*} amount
 * @param {*} currency
 * @returns
 */
function replaceQuotes (value) {
  if (!value || !value.length) {
    return ''
  }
  return value.split("'").join('&apos;').split('"').join('&quot;')
}

/**
 * Converts USD, EU and GBP to $xx.xx or equivalent
 * @param {*} amount the units of currency
 * @param {*} currency the type of currency usd, eu or gbp
 */
function money (amount, currency) {
  if (!currency) {
    return null
  }
  currency = currency.toLowerCase()
  switch (currency) {
    case 'usd':
    case 'aud':
    case 'nzd':
    case 'cad':
    case 'hkd':
    case 'sgd':
      return amount >= 0 ? `$${(amount / 100).toFixed(2)}` : `-$${(amount / -100).toFixed(2)}`
    case 'eur':
      return amount >= 0 ? `€${(amount / 100).toFixed(2)}` : `-€${(amount / -100).toFixed(2)}`
    case 'gbp':
      return amount > 0 ? `£${(amount / 100).toFixed(2)}` : `-£${(amount / -100).toFixed(2)}`
    case 'jpy':
      return amount > 0 ? `¥${(amount / 100).toFixed(2)}` : `-¥${(amount / -100).toFixed(2)}`
    default:
      return amount
  }
}

/**
 * Converts numbers to 1.4K 1.4M 1.4B etc
 */
function number (n) {
  return HRNumbers.toHumanString(n)
}

/**
 * Converts an object into a Date
 * @param {*} obj the date string or date
 */
function parseDate (obj) {
  if (!obj) {
    throw new Error('invalid-date')
  }
  if (obj.getFullYear) {
    return obj
  }
  if (obj.substring) {
    let dateString = obj
    if (!(dateString.indexOf(':') < dateString.lastIndexOf(':'))) {
      dateString += ' 00:00:00 UTC'
    }
    try {
      const i = Date.parse(dateString)
      if (!i) {
        throw new Error('invalid-date')
      }
      const d = new Date(i)
      if (d.getTime) {
        return d
      }
    } catch (error) {
    }
  } else {
    try {
      const d = new Date(obj)
      if (d.getTime && d.getTime() > 0) {
        return d
      }
    } catch (error) {
    }
  }
  throw new Error('invalid-date')
}

/**
 * Formats a date to 'YYYY-MM-DD'
 * @param {*} obj the date string or date
 */
function date (date) {
  const d = date.getTime ? date : (date > 0 ? new Date(date * 1000) : parseDate(date))
  if (!d) {
    return null
  }
  const year = d.getUTCFullYear()
  let month = d.getUTCMonth() + 1
  if (month < 10) {
    month = '0' + month
  }
  let day = d.getUTCDate()
  if (day < 10) {
    day = '0' + day
  }
  return `${year}-${month}-${day}`
}
