const { Sequelize } = require('sequelize')
const Log = require('./log.js')('sequelize-postgresql')

module.exports = async () => {
  let url = process.env.POSTGRESQL_DATABASE_URL
  const sslModeRequiredIndex = url.indexOf('?sslmode=require')
  let dialectOptions
  if (sslModeRequiredIndex > -1) {
    url = url.substring(0, sslModeRequiredIndex)
    dialectOptions = {
      ssl: {
        require: true,
        rejectUnauthorized: false
      },
      keepAlive: true
    }
  }
  const sequelize = new Sequelize(url, {
    dialect: 'postgres',
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
