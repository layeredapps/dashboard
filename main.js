const dashboard = require('./index.js')
dashboard.start(__dirname)
// add "hot reloading" to /public/ and routes
global.packageJSON.dashboard.serverFilePaths = global.packageJSON.dashboard.serverFilePaths || []
global.packageJSON.dashboard.serverFilePaths.push(
  require.resolve('./src/server/hot-reload.js')
)
global.packageJSON.dashboard.server = global.packageJSON.dashboard.server || []
global.packageJSON.dashboard.server.push(
  require('./src/server/hot-reload.js')
)
