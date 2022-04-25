const { Sequelize } = require('sequelize')
const Log = require('./log.js')('sequelize-mssql')

module.exports = async () => {
  const sequelize = new Sequelize(process.env.MSSQL_DATABASE, process.env.MSSQL_USERNAME, process.env.MSSQL_PASSWORD, {
    logging: (sql) => {
      return Log.info(sql)
    },
    dialect: 'mssql',
    dialectOptions: {
      driver: 'SQL Server Native Client 11.0'
    },
    host: process.env.MSSQL_HOST,
    port: process.env.MSSQL_PORT,
    pool: {
      max: process.env.MAX_CONNECTIONS || 10,
      min: 0,
      idle: process.env.IDLE_CONNECTION_LIMIT || 10000
    }
  })
  return sequelize
}
