const { Sequelize } = require('sequelize')
const Log = require('./log.js')('sequelize-mysql')

module.exports = async () => {
  const sequelize = new Sequelize(process.env.MYSQL_DATABASE, process.env.MYSQL_USERNAME, process.env.MYSQL_PASSWORD, {
    logging: (sql) => {
      return Log.info(sql)
    },
    dialect: 'mysql',
    host: process.env.MYSQL_HOST,
    port: process.env.MYSQL_PORT,
    pool: {
      max: process.env.MAX_CONNECTIONS || 10,
      min: 0,
      idle: process.env.IDLE_CONNECTION_LIMIT || 10000
    }
  })
  return sequelize
}
