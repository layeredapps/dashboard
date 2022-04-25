const { Sequelize } = require('sequelize')
const Log = require('./log.js')('sequelize-mariadb')

module.exports = async () => {
  const sequelize = new Sequelize(process.env.MARIADB_DATABASE, process.env.MARIADB_USERNAME, process.env.MARIADB_PASSWORD, {
    logging: (sql) => {
      return Log.info(sql)
    },
    dialect: 'mysql',
    host: process.env.MARIADB_HOST,
    port: process.env.MARIADB_PORT,
    pool: {
      max: process.env.MAX_CONNECTIONS || 10,
      min: 0,
      idle: process.env.IDLE_CONNECTION_LIMIT || 10000
    }
  })
  return sequelize
}
