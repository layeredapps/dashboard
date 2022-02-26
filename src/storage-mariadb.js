const { Sequelize, Model, DataTypes } = require('sequelize')

module.exports = async () => {
  const sequelize = new Sequelize(process.env.MARIADB_DATABASE, process.env.MARIADB_USERNAME, process.env.MARIADB_PASSWORD, {
    logging: false,
    dialect: 'mysql',
    host: process.env.MARIADB_HOST,
    port: process.env.MARIADB_PORT
  })
  class Account extends Model {}
  Account.init({
    accountid: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
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
    profileid: {
      type: DataTypes.UUID
    },
    usernameHash: DataTypes.STRING,
    passwordHash: DataTypes.STRING,
    sessionKey: DataTypes.STRING,
    sessionKeyNumber: DataTypes.INTEGER,
    sessionKeyLastResetAt: {
      type: DataTypes.DATE(6),
      get () {
        const rawValue = this.getDataValue('sessionKeyLastResetAt')
        return rawValue ? new Date(Date.parse(rawValue)) : undefined
      }
    },
    deletedAt: {
      type: DataTypes.DATE(6),
      get () {
        const rawValue = this.getDataValue('deletedAt')
        return rawValue ? new Date(Date.parse(rawValue)) : undefined
      }
    },
    lastSignedInAt: {
      type: DataTypes.DATE(6),
      get () {
        const rawValue = this.getDataValue('lastSignedInAt')
        return rawValue ? new Date(Date.parse(rawValue)) : undefined
      }
    },
    resetCodeLastCreatedAt: {
      type: DataTypes.DATE(6),
      get () {
        const rawValue = this.getDataValue('resetCodeLastCreatedAt')
        return rawValue ? new Date(Date.parse(rawValue)) : undefined
      }
    },
    resetCodeLastUsedAt: {
      type: DataTypes.DATE(6),
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
      type: DataTypes.DATE(6),
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
      type: DataTypes.DATE(6),
      get () {
        const rawValue = this.getDataValue('administratorSince')
        return rawValue ? new Date(Date.parse(rawValue)) : undefined
      }
    },
    createdAt: DataTypes.DATE(6),
    updatedAt: DataTypes.DATE(6)
  }, {
    sequelize,
    modelName: 'account',
    timestamps: true,
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  })

  class ResetCode extends Model {}
  ResetCode.init({
    codeid: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    object: {
      type: DataTypes.VIRTUAL,
      get () {
        return 'resetCode'
      }
    },
    accountid: DataTypes.UUID,
    secretCodeHash: DataTypes.STRING,
    createdAt: DataTypes.DATE(6),
    updatedAt: DataTypes.DATE(6)
  }, {
    sequelize,
    modelName: 'resetCode',
    timestamps: true,
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  })

  class Session extends Model {}
  Session.init({
    sessionid: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    object: {
      type: DataTypes.VIRTUAL,
      get () {
        return 'session'
      }
    },
    accountid: DataTypes.UUID,
    tokenHash: DataTypes.STRING,
    duration: DataTypes.INTEGER,
    expiresAt: {
      type: new DataTypes.VIRTUAL(DataTypes.DATE(6), ['createdAt', 'duration']),
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
      type: DataTypes.DATE(6),
      defaultValue: DataTypes.NOW,
      get () {
        const rawValue = this.getDataValue('lastVerifiedAt')
        return rawValue ? new Date(Date.parse(rawValue)) : undefined
      }
    },
    endedAt: {
      type: DataTypes.DATE(6),
      defaultValue: undefined,
      get () {
        const rawValue = this.getDataValue('lastVerifiedAt')
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
    createdAt: DataTypes.DATE(6),
    updatedAt: DataTypes.DATE(6)
  }, {
    sequelize,
    modelName: 'session',
    timestamps: true,
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  })

  class Profile extends Model {}
  Profile.init({
    profileid: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    object: {
      type: DataTypes.VIRTUAL,
      get () {
        return 'profile'
      }
    },
    accountid: DataTypes.UUID,
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
    createdAt: DataTypes.DATE(6),
    updatedAt: DataTypes.DATE(6)
  }, {
    sequelize,
    modelName: 'profile',
    timestamps: true,
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  })

  await sequelize.sync({ force: true, alter: true })
  return {
    sequelize,
    flush: async () => {
      await Profile.drop()
      await Account.drop()
      await ResetCode.drop()
      await Session.drop()
      await sequelize.sync({ force: true, alter: true })
    },
    Account,
    Session,
    ResetCode,
    Profile
  }
}
