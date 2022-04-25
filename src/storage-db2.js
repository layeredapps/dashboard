const { Sequelize } = require('sequelize')
const Log = require('./log.js')('sequelize-db2')

module.exports = async () => {
  const sequelize = new Sequelize(process.env.DB2_DATABASE, process.env.DB2_USERNAME, process.env.DB2_PASSWORD, {
    logging: (sql) => {
      return Log.info(sql)
    },
    dialect: 'db2',
    host: process.env.DB2_HOST,
    port: process.env.DB2_PORT,
    pool: {
      max: process.env.MAX_CONNECTIONS || 10,
      min: 0,
      idle: process.env.IDLE_CONNECTION_LIMIT || 10000
    }
  })
  return sequelize
}
