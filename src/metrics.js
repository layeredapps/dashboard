const Format = require('./format.js')
const Log = require('./log.js')('redis-metrics')
const upsertedCache = {}
let redisStorage, dashboardStorage

module.exports = {
  setup: async (storage) => {
    if (process.env.STORAGE_METRICS === 'redis') {
      Log.info('starting redis connection')
      const Redis = require('redis')
      const configuration = {
        url: process.env.METRICS_REDIS_URL || process.env.REDIS_URL || 'redis://127.0.0.1:6379'
      }
      redisStorage = Redis.createClient(configuration)
      redisStorage.on('error', (error) => {
        Log.error('redis connection error', error)
        try {
          client = Redis.createClient(configuration)
        } catch (error) {
          Log.error('unable to reconnect redis', error)
          throw error
        }
      })
      redisStorage.on('end', () => {
        Log.info('ending redis connection')
        redisStorage = null
      })
      await redisStorage.connect()
    } else {
      dashboardStorage = storage
    }
  },
  aggregate: async (appid, metric, date, amount) => {
    let monthPart = (date.getUTCMonth() + 1).toString()
    if (monthPart.length === 1) {
      monthPart = `0${monthPart}`
    }
    let dayPart = date.getUTCDate().toString()
    if (dayPart.length === 1) {
      dayPart = `0${dayPart}`
    }
    const yearKey = `${metric}/${date.getUTCFullYear().toString()}`
    const monthKey = `${yearKey}-${monthPart}`
    const dayKey = `${monthKey}-${dayPart}`
    const totalKey = `${metric}/total`
    if (process.env.STORAGE_METRICS === 'redis') {
      await redisStorage.hIncrBy(`${appid}/metrics`, yearKey, amount || 1)
      await redisStorage.hIncrBy(`${appid}/metrics`, monthKey, amount || 1)
      await redisStorage.hIncrBy(`${appid}/metrics`, dayKey, amount || 1)
      await redisStorage.hIncrBy(`${appid}/metrics`, totalKey, amount || 1)
    } else {
      // day
      if (!upsertedCache[`${appid}/${dayKey}`]) {
        await dashboardStorage.Metric.upsert({
          metricid: dayKey,
          appid
        }, {
          where: {
            metricid: dayKey,
            appid
          }
        })
        upsertedCache[`${appid}/${dayKey}`] = true
      }
      // month
      if (!upsertedCache[`${appid}/${monthKey}`]) {
        await dashboardStorage.Metric.upsert({
          metricid: monthKey,
          appid
        }, {
          where: {
            metricid: monthKey,
            appid
          }
        })
        upsertedCache[`${appid}/${monthKey}`] = true
      }
      // year
      if (!upsertedCache[`${appid}/${yearKey}`]) {
        await dashboardStorage.Metric.upsert({
          metricid: yearKey,
          appid
        }, {
          where: {
            metricid: yearKey,
            appid
          }
        })
        upsertedCache[`${appid}/${yearKey}`] = true
      }
      // total
      if (!upsertedCache[`${appid}/${totalKey}`]) {
        await dashboardStorage.Metric.upsert({
          metricid: totalKey,
          appid
        }, {
          where: {
            metricid: totalKey,
            appid
          }
        })
        upsertedCache[`${appid}/${totalKey}`] = true
      }
      // clear cached keys except the ones we just used
      if (Object.keys(upsertedCache).length > 100 || process.env.NODE_ENV === 'testing') {
        for (const key in upsertedCache) {
          if (key !== dayKey && key !== monthKey && key !== yearKey && key !== totalKey) {
            delete (upsertedCache[key])
          }
        }
      }
      // increase the values for the aggregate keys
      await dashboardStorage.Metric.increment({
        value: amount || 1
      }, {
        where: {
          appid,
          metricid: [
            dayKey,
            monthKey,
            yearKey,
            totalKey
          ]
        }
      })
    }
  },
  keyRange: async (appid, keys) => {
    if (process.env.STORAGE_METRICS === 'redis') {
      const response = await redisStorage.hmGet(`${appid}/metrics`, keys)
      const data = []
      for (const i in keys) {
        if (!response[i]) {
          continue
        }
        const object = {
          appid,
          metricid: keys[i],
          value: parseInt(response[i], 10)
        }
        data.push(object)
      }
      return data
    } else {
      const rawData = await dashboardStorage.Metric.findAll({
        where: {
          appid,
          metricid: keys
        }
      })
      const data = []
      for (const row of rawData) {
        const metric = {}
        for (const field of row._options.attributes) {
          metric[field] = row.get(field)
        }
        data.push(metric)
      }
      return data
    }
  },
  close: () => {
    if (redisStorage) {
      return redisStorage.quit()
    }
  },
  maximumDay,
  days,
  highlights,
  metricKeys,
  chartValues
}

function maximumDay (data) {
  let maximum = 0
  for (const row of data) {
    if (row.metricid.endsWith('/total')) {
      continue
    }
    const dateParts = row.metricid.split('/')[1].split('-')
    if (dateParts.length < 3) {
      continue
    }
    if (row.value > maximum) {
      maximum = row.value
    }
  }
  return maximum
}

function days (data, maximum) {
  const day = []
  // isolate day keys
  for (const row of data) {
    if (row.metricid.endsWith('/total')) {
      continue
    }
    const dateParts = row.metricid.split('/')[1].split('-')
    if (dateParts.length < 3) {
      continue
    }
    day.push(row)
  }
  // normalize and offset for the chart
  for (const row of day) {
    row.normalized = Math.ceil(row.value / maximum * 100)
    row.top = 100 - row.normalized
  }
  return day
}

function highlights (data, days) {
  const highlight = {
    object: 'highlight',
    today: 0,
    yesterday: 0,
    last7Days: 0,
    last30Days: 0,
    last90Days: 0
  }
  const now = new Date()
  const yesterday = new Date(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - 1)
  const todayKey = `/${now.getUTCFullYear()}-${twoDigits(now.getUTCMonth() + 1)}-${twoDigits(now.getUTCDate())}`
  const yesterdayKey = `/${yesterday.getUTCFullYear()}-${twoDigits(yesterday.getUTCMonth() + 1)}-${twoDigits(yesterday.getUTCDate())}`
  for (const row of data) {
    if (row.metricid.endsWith('/total')) {
      highlight.total = row.value
      continue
    }
    if (row.metricid.endsWith(yesterdayKey)) {
      highlight.yesterday = row.value
    }
    if (row.metricid.endsWith(todayKey)) {
      highlight.today = row.value
    }
  }
  for (const i in days) {
    const int = parseInt(i, 10)
    if (int === 0) {
      highlight.today = days[int].value
    }
    if (int < 7) {
      highlight.last7Days += days[int].value
    }
    if (int < 30) {
      highlight.last30Days += days[int].value
    }
    if (int < 90) {
      highlight.last90Days += days[int].value
    }
  }
  for (const key in highlight) {
    if (key === 'object') {
      continue
    }
    highlight[`${key}Formatted`] = Format.number(highlight[key])
  }
  return highlight
}

function metricKeys (metric, days) {
  days = days || 90
  // all time total
  const keys = [
    `${metric}/total`
  ]
  const now = new Date()
  // last 3 months
  const lastMonth = new Date(now.getUTCFullYear(), now.getUTCMonth() - 1, now.getUTCDate(), 0, 0, 0, 0)
  const secondLastMonth = new Date(now.getUTCFullYear(), now.getUTCMonth() - 2, now.getUTCDate(), 0, 0, 0, 0)
  keys.push(
    `${metric}/${now.getUTCFullYear()}-${twoDigits(now.getUTCMonth() + 1)}`,
    `${metric}/${lastMonth.getUTCFullYear()}-${twoDigits(lastMonth.getUTCMonth() + 1)}`,
    `${metric}/${secondLastMonth.getUTCFullYear()}-${twoDigits(secondLastMonth.getUTCMonth() + 1)}`
  )
  // last 90 days
  for (let i = 0; i < days; i++) {
    const date = i > 0 ? new Date(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - i, 0, 0, 0, 0) : now
    keys.push(`${metric}/${date.getUTCFullYear()}-${twoDigits(date.getUTCMonth() + 1)}-${twoDigits(date.getUTCDate())}`)
  }
  return keys
}

function twoDigits (n) {
  if (n < 10) {
    return `0${n}`
  }
  return n.toString()
}

function chartValues (maximum) {
  if (maximum === 0) {
    return [
      { object: 'object', value: 0 },
      { object: 'object', value: '' },
      { object: 'object', value: '' },
      { object: 'object', value: '' },
      { object: 'object', value: '' }
    ]
  }
  if (maximum < 4) {
    return [
      { object: 'object', value: maximum },
      { object: 'object', value: '' },
      { object: 'object', value: '' },
      { object: 'object', value: '' },
      { object: 'object', value: 0 }
    ]
  }
  return [
    { object: 'object', value: Format.number(maximum) },
    { object: 'object', value: Format.number(Math.floor(maximum * 0.75)) },
    { object: 'object', value: Format.number(Math.floor(maximum * 0.5)) },
    { object: 'object', value: Format.number(Math.floor(maximum * 0.25)) },
    { object: 'object', value: 0 }
  ]
}
