const metrics = require('./metrics.js')

module.exports = async () => {
  let storage
  switch (process.env.STORAGE) {
    case 'postgresql':
    case 'postgres':
      storage = require('./storage-postgresql.js')
      break
    case 'mariadb':
      storage = require('./storage-mariadb.js')
      break
    case 'mysql':
      storage = require('./storage-mysql.js')
      break
    case 'db2':
      storage = require('./storage-db2.js')
      break
    case 'mssql':
      storage = require('./storage-mssql.js')
      break
    case 'sqlite':
    default:
      storage = require('./storage-sqlite.js')
      break
  }
  const container = await storage()
  container.Account.afterCreate(accountsCreated)
  container.Account.afterBulkUpdate(accountsDeleteRequest)
  container.Account.afterDestroy(accountDeleted)
  container.Session.afterCreate(sessionsCreated)
  container.Session.afterUpdate(activeSessions)
  container.ResetCode.afterCreate(resetCodesCreated)
  container.Account.afterBulkUpdate(accountsDeleteRequest)
  return container
}

async function accountsCreated () {
  await metrics.aggregate('accounts-created', new Date())
}

async function accountsDeleteRequest (account) {
  if (account.attributes.deletedAt) {
    await metrics.aggregate('account-delete-requests', new Date())
  }
  if (account.attributes.resetCodeLastUsedAt) {
    await metrics.aggregate('resetcodes-used', new Date())
  }
}

async function accountDeleted () {
  await metrics.aggregate('account-deleted', new Date())
}

async function sessionsCreated () {
  await metrics.aggregate('sessions-created', new Date())
  await metrics.aggregate('active-sessions', new Date())
}

async function activeSessions () {
  await metrics.aggregate('active-sessions', new Date())
}

async function resetCodesCreated () {
  await metrics.aggregate('resetcodes-created', new Date())
}
