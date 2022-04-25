const metrics = require('./metrics.js')
const { Model, DataTypes } = require('sequelize')
const Log = require('./log.js')('sequelize')

module.exports = async () => {
  let storage, dateType
  switch (process.env.STORAGE) {
    case 'postgresql':
    case 'postgres':
      storage = require('./storage-postgresql.js')
      dateType = DataTypes.DATE
      break
    case 'mariadb':
      storage = require('./storage-mariadb.js')
      dateType = DataTypes.DATE(6)
      break
    case 'mysql':
      storage = require('./storage-mysql.js')
      dateType = DataTypes.DATE(6)
      break
    case 'db2':
      storage = require('./storage-db2.js')
      dateType = DataTypes.DATE
      break
    case 'mssql':
      storage = require('./storage-mssql.js')
      dateType = DataTypes.DATE
      break
    case 'sqlite':
    default:
      storage = require('./storage-sqlite.js')
      dateType = DataTypes.DATE
      break
  }
  const sequelize = await storage()
  class Account extends Model {}
  Account.init({
    accountid: {
      type: DataTypes.STRING(64),
      primaryKey: true,
      defaultValue: () => {
        const idValue = Math.random().toString(16).substring(2) + Math.random().toString(16).substring(2)
        return 'acct_' + idValue.substring(0, 16)
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
        const idValue = Math.random().toString(16).substring(2) + Math.random().toString(16).substring(2)
        return 'code_' + idValue.substring(0, 16)
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
        const idValue = Math.random().toString(16).substring(2) + Math.random().toString(16).substring(2)
        return 'sess_' + idValue.substring(0, 16)
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
        const idValue = Math.random().toString(16).substring(2) + Math.random().toString(16).substring(2)
        return 'prof_' + idValue.substring(0, 16)
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
  await sequelize.sync({ alter: true, force: true })
  const originalQuery = sequelize.query
  sequelize.query = function () {
    return originalQuery.apply(this, arguments).catch((error) => {
      Log.error(error)
      throw error
    })
  }
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
        await Profile.destroy({ where: {} })
        await Account.destroy({ where: {} })
        await ResetCode.destroy({ where: {} })
        await Session.destroy({ where: {} })
        await Metric.destroy({ where: {} })
      }
    },
    Account,
    Session,
    ResetCode,
    Profile,
    Metric
  }
}
