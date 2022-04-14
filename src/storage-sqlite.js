const { Sequelize } = require('sequelize')

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
  return sequelize
}
