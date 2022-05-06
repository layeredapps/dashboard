const dashboard = require('./index.js')
dashboard.start(__dirname)
// add "hot reloading" to /public/ and routes
global.packageJSON.dashboard.serverFilePaths = global.packageJSON.dashboard.serverFilePaths || []
global.packageJSON.dashboard.serverFilePaths.push(
  require.resolve('./src/server/always-reload-files.js'),
  require.resolve('./src/server/always-reload-routes.js')
)
global.packageJSON.dashboard.server = global.packageJSON.dashboard.server || []
global.packageJSON.dashboard.server.push(
  require('./src/server/always-reload-files.js'),
  require('./src/server/always-reload-routes.js')
)
