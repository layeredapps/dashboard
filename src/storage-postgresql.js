const { Sequelize } = require('sequelize')
const Log = require('./log.js')('sequelize-postgresql')

module.exports = async () => {
  const sequelize = new Sequelize(process.env.POSTGRESQL_DATABASE_URL, {
    dialect: 'sqlite',
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
