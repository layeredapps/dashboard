const { Sequelize, Model, DataTypes } = require('sequelize')

module.exports = async () => {
  let sequelize
  if (process.env.SQLITE_DATABASE_FILE) {
    sequelize = new Sequelize(process.env.SQLITE_DATABASE || 'dashboard', '', '', {
      storage: process.env.SQLITE_DATABASE_FILE,
      dialect: 'sqlite',
      logging: false,
      pool: {
        max: process.env.MAX_CONNECTIONS || 10,
        min: 0,
        idle: process.env.IDLE_CONNECTION_LIMIT || 10000
      }
    })
  } else {
    sequelize = new Sequelize('sqlite::memory', {
      dialect: 'sqlite',
      logging: false,
      pool: {
        max: process.env.MAX_CONNECTIONS || 10,
        min: 0,
        idle: process.env.IDLE_CONNECTION_LIMIT || 10000
      }
    })
  }
  class Account extends Model {}
  Account.init({
    accountid: {
      type: DataTypes.STRING(21),
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
    profileid: DataTypes.STRING(21),
    usernameHash: {
      type: DataTypes.STRING,
      unique: true
    },
    passwordHash: DataTypes.STRING,
    sessionKey: DataTypes.STRING,
    sessionKeyNumber: DataTypes.INTEGER,
    sessionKeyLastResetAt: {
      type: DataTypes.DATE,
      get () {
        const rawValue = this.getDataValue('sessionKeyLastResetAt')
        return rawValue ? new Date(Date.parse(rawValue)) : undefined
      }
    },
    deletedAt: {
      type: DataTypes.DATE,
      get () {
        const rawValue = this.getDataValue('deletedAt')
        return rawValue ? new Date(Date.parse(rawValue)) : undefined
      }
    },
    lastSignedInAt: {
      type: DataTypes.DATE,
      get () {
        const rawValue = this.getDataValue('lastSignedInAt')
        return rawValue ? new Date(Date.parse(rawValue)) : undefined
      }
    },
    resetCodeLastCreatedAt: {
      type: DataTypes.DATE,
      get () {
        const rawValue = this.getDataValue('resetCodeLastCreatedAt')
        return rawValue ? new Date(Date.parse(rawValue)) : undefined
      }
    },
    resetCodeLastUsedAt: {
      type: DataTypes.DATE,
      get () {
        const rawValue = this.getDataValue('resetCodeLastCreatedAt')
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
      type: DataTypes.DATE,
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
      type: DataTypes.DATE,
      get () {
        const rawValue = this.getDataValue('administratorSince')
        return rawValue ? new Date(Date.parse(rawValue)) : undefined
      }
    }
  }, {
    sequelize,
    modelName: 'account'
  })

  class ResetCode extends Model {}
  ResetCode.init({
    codeid: {
      type: DataTypes.STRING(21),
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
    accountid: DataTypes.STRING(21),
    secretCodeHash: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'resetCode'
  })

  class Session extends Model {}
  Session.init({
    sessionid: {
      type: DataTypes.STRING(21),
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
    accountid: DataTypes.STRING(21),
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
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      get () {
        const rawValue = this.getDataValue('lastVerifiedAt')
        return rawValue ? new Date(Date.parse(rawValue)) : undefined
      }
    },
    endedAt: {
      type: DataTypes.DATE,
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
    }
  }, {
    sequelize,
    modelName: 'session'
  })

  class Profile extends Model {}
  Profile.init({
    profileid: {
      type: DataTypes.STRING(21),
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
    accountid: DataTypes.STRING(21),
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
    fields: DataTypes.JSON
  }, {
    sequelize,
    modelName: 'profile'
  })

  class Metric extends Model {}
  Metric.init({
    metricid: {
      type: DataTypes.STRING(32),
      primaryKey: true
    },
    object: {
      type: DataTypes.VIRTUAL,
      get () {
        return 'metric'
      }
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
      type: DataTypes.BIGINT,
      defaultValue: 0
    }
  }, {
    sequelize,
    modelName: 'metric'
  })
  
  await sequelize.sync({ alter: true })
  return {
    sequelize,
    flush: async () => {
      await Profile.destroy({ where: {} })
      await Account.destroy({ where: {} })
      await ResetCode.destroy({ where: {} })
      await Session.destroy({ where: {} })
      await Metric.destroy({ where: {} })
      await sequelize.sync()
    },
    Account,
    Session,
    ResetCode,
    Profile,
    Metric
  }
}
