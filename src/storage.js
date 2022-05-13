const crypto = require('crypto')
const metrics = require('./metrics.js')
const { Sequelize, Model, DataTypes } = require('sequelize')
const Log = require('./log.js')('sequelize')

module.exports = async () => {
  let dateType
  switch (process.env.STORAGE) {
    case 'mariadb':
    case 'mysql':
      dateType = DataTypes.DATE(6)
      break
    case 'postgresql':
    case 'postgres':
    case 'db2':
    case 'mssql':
    case 'sqlite':
    default:
      dateType = DataTypes.DATE
      break
  }
  const sequelize = await createConnection(process.env.STORAGE)
  class Account extends Model {}
  Account.init({
    accountid: {
      type: DataTypes.STRING(64),
      primaryKey: true,
      defaultValue: () => {
        return 'acct_' + crypto.randomBytes(8).toString('hex')
      }
    },
    object: {
      type: DataTypes.VIRTUAL,
      get () {
        return 'account'
      }
    },
    appid: {
      type: DataTypes.STRING,
      defaultValue: global.appid
    },
    profileid: DataTypes.STRING(64),
    usernameHash: {
      type: DataTypes.STRING,
      unique: true
    },
    passwordHash: DataTypes.STRING,
    sessionKey: DataTypes.STRING,
    sessionKeyNumber: DataTypes.INTEGER,
    sessionKeyLastResetAt: {
      type: dateType,
      get () {
        const rawValue = this.getDataValue('sessionKeyLastResetAt')
        return rawValue ? new Date(Date.parse(rawValue)) : undefined
      }
    },
    deletedAt: {
      type: dateType,
      get () {
        const rawValue = this.getDataValue('deletedAt')
        return rawValue ? new Date(Date.parse(rawValue)) : undefined
      }
    },
    lastSignedInAt: {
      type: dateType,
      get () {
        const rawValue = this.getDataValue('lastSignedInAt')
        return rawValue ? new Date(Date.parse(rawValue)) : undefined
      }
    },
    resetCodeLastCreatedAt: {
      type: dateType,
      get () {
        const rawValue = this.getDataValue('resetCodeLastCreatedAt')
        return rawValue ? new Date(Date.parse(rawValue)) : undefined
      }
    },
    resetCodeLastUsedAt: {
      type: dateType,
      get () {
        const rawValue = this.getDataValue('resetCodeLastUsedAt')
        return rawValue ? new Date(Date.parse(rawValue)) : undefined
      }
    },
    owner: {
      type: DataTypes.VIRTUAL(DataTypes.BOOLEAN, ['ownerSince']),
      get () {
        return this.getDataValue('ownerSince') > 0 ? true : undefined
      }
    },
    ownerSince: {
      type: dateType,
      get () {
        const rawValue = this.getDataValue('ownerSince')
        return rawValue ? new Date(Date.parse(rawValue)) : undefined
      }
    },
    administrator: {
      type: DataTypes.VIRTUAL(DataTypes.BOOLEAN, ['administratorSince']),
      get () {
        return this.get('administratorSince') > 0 ? true : undefined
      }
    },
    administratorSince: {
      type: dateType,
      get () {
        const rawValue = this.getDataValue('administratorSince')
        return rawValue ? new Date(Date.parse(rawValue)) : undefined
      }
    },
    usernameLastChangedAt: {
      type: dateType,
      get () {
        const rawValue = this.getDataValue('usernameLastChangedAt')
        return rawValue ? new Date(Date.parse(rawValue)) : undefined
      }
    },
    passwordLastChangedAt: {
      type: dateType,
      get () {
        const rawValue = this.getDataValue('passwordLastChangedAt')
        return rawValue ? new Date(Date.parse(rawValue)) : undefined
      }
    },
    // 'createdAt' is specified for each model because mysql/mariadb truncate
    // the ms and this makes the return order unpredictable and throws off the
    // test suites expecting the write order to match the return order
    createdAt: {
      type: dateType,
      allowNull: true,
      defaultValue: DataTypes.NOW
    }
  }, {
    sequelize,
    modelName: 'account'
  })

  class ResetCode extends Model {}
  ResetCode.init({
    codeid: {
      type: DataTypes.STRING(64),
      primaryKey: true,
      defaultValue: () => {
        return 'code_' + crypto.randomBytes(8).toString('hex')
      }
    },
    object: {
      type: DataTypes.VIRTUAL,
      get () {
        return 'resetCode'
      }
    },
    appid: {
      type: DataTypes.STRING,
      defaultValue: global.appid
    },
    accountid: DataTypes.STRING(64),
    secretCodeHash: DataTypes.STRING,
    createdAt: {
      type: dateType,
      allowNull: true,
      defaultValue: DataTypes.NOW
    }
  }, {
    sequelize,
    modelName: 'resetCode'
  })

  class Session extends Model {}
  Session.init({
    sessionid: {
      type: DataTypes.STRING(64),
      primaryKey: true,
      defaultValue: () => {
        return 'sess_' + crypto.randomBytes(8).toString('hex')
      }
    },
    object: {
      type: DataTypes.VIRTUAL,
      get () {
        return 'session'
      }
    },
    appid: {
      type: DataTypes.STRING,
      defaultValue: global.appid
    },
    accountid: DataTypes.STRING(64),
    tokenHash: DataTypes.STRING,
    duration: DataTypes.INTEGER,
    csrfToken: {
      type: DataTypes.STRING(128),
      defaultValue: () => {
        return crypto.randomBytes(64).toString('hex')
      }
    },
    expiresAt: {
      type: new DataTypes.VIRTUAL(DataTypes.DATE, ['createdAt', 'duration']),
      get () {
        const createdAt = new Date(Date.parse(this.getDataValue('createdAt')))
        const durationValue = this.getDataValue('duration')
        return new Date(createdAt.getTime() + (durationValue * 1000))
      },
      set () {
        throw new Error('The "expiresAt" field is virtual')
      }
    },
    lastVerifiedAt: {
      type: dateType,
      defaultValue: DataTypes.NOW,
      get () {
        const rawValue = this.getDataValue('lastVerifiedAt')
        return rawValue ? new Date(Date.parse(rawValue)) : undefined
      }
    },
    endedAt: {
      type: dateType,
      defaultValue: undefined,
      get () {
        const rawValue = this.getDataValue('endedAt')
        return rawValue ? new Date(Date.parse(rawValue)) : undefined
      }
    },
    ended: {
      type: DataTypes.VIRTUAL(DataTypes.BOOLEAN, ['endedAt', 'expiresAt']),
      get () {
        const rawEndedAtValue = this.getDataValue('endedAt')
        const endedAt = rawEndedAtValue ? new Date(Date.parse(rawEndedAtValue)) : undefined
        if (endedAt) {
          return true
        }
        const expiresAt = new Date(Date.parse(this.getDataValue('expiresAt')))
        return new Date().getTime() < expiresAt.getTime()
      }
    },
    createdAt: {
      type: dateType,
      allowNull: true,
      defaultValue: DataTypes.NOW
    }
  }, {
    sequelize,
    modelName: 'session'
  })

  class Profile extends Model {}
  Profile.init({
    profileid: {
      type: DataTypes.STRING(64),
      primaryKey: true,
      defaultValue: () => {
        return 'prof_' + crypto.randomBytes(8).toString('hex')
      }
    },
    object: {
      type: DataTypes.VIRTUAL,
      get () {
        return 'profile'
      }
    },
    appid: {
      type: DataTypes.STRING,
      defaultValue: global.appid
    },
    accountid: DataTypes.STRING(64),
    companyName: DataTypes.STRING,
    firstName: DataTypes.STRING,
    lastName: DataTypes.STRING,
    contactEmail: DataTypes.STRING,
    displayEmail: DataTypes.STRING,
    displayName: DataTypes.STRING,
    phone: DataTypes.STRING,
    occupation: DataTypes.STRING,
    location: DataTypes.STRING,
    dob: DataTypes.DATEONLY,
    website: DataTypes.STRING,
    fields: DataTypes.JSON,
    createdAt: {
      type: dateType,
      allowNull: true,
      defaultValue: DataTypes.NOW
    }
  }, {
    sequelize,
    modelName: 'profile'
  })

  class Metric extends Model {}
  Metric.init({
    metricid: {
      type: DataTypes.STRING(64),
      primaryKey: true
    },
    object: {
      type: DataTypes.VIRTUAL,
      get () {
        return 'metric'
      }
    },
    appid: {
      type: DataTypes.STRING,
      defaultValue: global.appid
    },
    name: {
      type: DataTypes.VIRTUAL,
      get () {
        return this.getDataValue('metricid').split('/')[0]
      }
    },
    dateKey: {
      type: DataTypes.VIRTUAL,
      get () {
        return this.getDataValue('metricid').split('/')[1]
      }
    },
    value: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    createdAt: {
      type: dateType,
      allowNull: true,
      defaultValue: DataTypes.NOW
    }
  }, {
    sequelize,
    modelName: 'metric'
  })
  // table creation
  await sequelize.sync()
  // exception logging
  const originalQuery = sequelize.query
  sequelize.query = function () {
    return originalQuery.apply(this, arguments).catch((error) => {
      Log.error(error)
      throw error
    })
  }
  // metrics
  Account.afterCreate(async (object) => {
    if (global.disableMetrics) {
      return
    }
    await metrics.aggregate(object.dataValues.appid, 'accounts-created', object.dataValues.createdAt)
  })
  Account.afterBulkUpdate(async (object) => {
    if (global.disableMetrics) {
      return
    }
    if (object.attributes.deletedAt) {
      const account = await Account.findOne({ where: object.where, attributes: ['appid'] })
      await metrics.aggregate(account.dataValues.appid, 'account-delete-requests', object.attributes.deletedAt)
    }
    if (object.attributes.resetCodeLastUsedAt) {
      const account = await Account.findOne({ where: object.where, attributes: ['appid'] })
      await metrics.aggregate(account.dataValues.appid, 'resetcodes-used', object.attributes.resetCodeLastUsedAt)
    }
    if (object.attributes.lastSignedInAt) {
      const account = await Account.findOne({ where: object.where, attributes: ['appid', 'lastSignedInAt'] })
      if (account.dataValues.lastSignedInAt.getDate() !== object.attributes.lastSignedInAt.getDate()) {
        await metrics.aggregate(account.dataValues.appid, 'active-sessions', object.attributes.lastSignedInAt)
      }
    }
  })
  Account.beforeBulkDestroy(async (object) => {
    if (global.disableMetrics) {
      return
    }
    if (!object.where.accountid) {
      return
    }
    const account = await Account.findOne({ where: object.where })
    await metrics.aggregate(account.appid, 'account-deleted', new Date())
  })
  Session.afterCreate(async (object) => {
    if (global.disableMetrics) {
      return
    }
    await metrics.aggregate(object.dataValues.appid, 'sessions-created', object.dataValues.createdAt)
    await metrics.aggregate(object.dataValues.appid, 'active-sessions', object.dataValues.createdAt)
  })
  ResetCode.afterCreate(async (object) => {
    if (global.disableMetrics) {
      return
    }
    await metrics.aggregate(object.dataValues.appid, 'resetcodes-created', object.dataValues.createdAt)
  })
  return {
    sequelize,
    flush: async () => {
      if (process.env.NODE_ENV === 'testing') {
        await Profile.sync({ force: true })
        await Account.sync({ force: true })
        await ResetCode.sync({ force: true })
        await Session.sync({ force: true })
        await Metric.sync({ force: true })
      }
    },
    Account,
    Session,
    ResetCode,
    Profile,
    Metric
  }
}

async function createConnection (dialect) {
  // sqlite
  if (dialect === 'sqlite') {
    if (process.env.DATABASE_FILE) {
      return new Sequelize(process.env.DATABASE || 'dashboard', '', '', {
        storage: process.env.DATABASE_FILE,
        dialect: 'sqlite',
        logging: (sql) => {
          return Log.info(sql)
        }
      })
    } else {
      return new Sequelize('sqlite::memory', {
        dialect: 'sqlite',
        logging: (sql) => {
          return Log.info(sql)
        }
      })
    }
  }
  // all other databases
  let url = global.databaseURL || process.env.DATABASE_URL
  const sslModeRequiredIndex = url.indexOf('?sslmode=require')
  const dialectOptions = {}
  if (sslModeRequiredIndex > -1) {
    url = url.substring(0, sslModeRequiredIndex)
    dialectOptions.ssl = {
      require: true,
      rejectUnauthorized: false
    }
    dialectOptions.keepAlive = true
  }
  if (dialect === 'mssql') {
    dialectOptions.driver = 'SQL Server Native Client 11.0'
  }
  if (process.env.STORAGE_REPLICATION) {
    const replication = {
      read: [],
      write: parseConnectionString(url)
    }
    let i = 1
    while (true) {
      if (!global[`readDatabaseURL${i}`] && !process.env[`READ_DATABASE_URL${i}`]) {
        break
      }
      replication.read.push(parseConnectionString(global[`readDatabaseURL${i}`] || process.env[`READ_DATABASE_URL${i}`]))
      i++
    }
    const sequelize = new Sequelize({
      dialect,
      dialectOptions,
      replication,
      logging: (sql) => {
        return Log.info(sql)
      },
      pool: {
        max: process.env.MAX_CONNECTIONS || 10,
        min: 0,
        idle: process.env.IDLE_CONNECTION_LIMIT || 10000
      }
    })
    return sequelize
  }
  const sequelize = new Sequelize(url, {
    dialect,
    dialectOptions,
    logging: (sql) => {
      return Log.info(sql)
    },
    pool: {
      max: process.env.MAX_CONNECTIONS || 10,
      min: 0,
      idle: process.env.IDLE_CONNECTION_LIMIT || 10000
    }
  })
  return sequelize
}

function parseConnectionString (url) {
  // dialect://username:password@host:port/database
  if (url.indexOf('://') > -1) {
    const urlParts = url.parse(url, true)
    const object = {}
    object.host = urlParts.hostname
    if (urlParts.pathname) {
      object.database = urlParts.pathname.replace(/^\//, '')
    }
    if (urlParts.port) {
      object.port = urlParts.port
    }
    if (urlParts.auth) {
      const authParts = urlParts.auth.split(':')
      object.username = authParts[0]
      if (authParts.length > 1) {
        object.password = authParts.slice(1).join(':')
      }
    }
    return object
  }
  // User Id=X;Password=X;Server=X;Database=X;Port=X
  const params = url.split(';')
  const rawParams = {}
  for (const param of params) {
    const parts = param.split('=')
    rawParams[parts[0]] = parts.slice(1).join('=')
  }
  const object = {}
  object.host = rawParams.Server || rawParams.server
  object.username = rawParams['User Id'] || rawParams['user id']
  object.password = rawParams.Password || rawParams.password
  object.database = rawParams.Database || rawParams.database
  object.port = rawParams.Port || rawParams.port
  return object
}
