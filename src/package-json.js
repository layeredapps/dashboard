const fs = require('fs')
const path = require('path')
const Log = require('./log.js')('package-json')

module.exports = {
  merge,
  mergeTitle,
  mergeScriptArray,
  mergeModuleArray,
  mergeHTMLFileMenuLinks,
  mergeSpecialHTML
}

function merge (applicationJSON, dashboardJSON) {
  applicationJSON = applicationJSON || loadApplicationJSON(applicationJSON)
  if (applicationJSON && applicationJSON.name === '@layeredapps/dashboard') {
    dashboardJSON = applicationJSON
    applicationJSON = null
  } else {
    dashboardJSON = dashboardJSON || loadModuleFile('@layeredapps/dashboard', '/package.json')
  }
  const packageJSON = {
    version: dashboardJSON.version,
    dashboard: {
      server: [],
      serverFilePaths: [],
      content: [],
      contentFilePaths: [],
      proxy: [],
      proxyFilePaths: [],
      modules: [],
      moduleNames: [],
      moduleVersions: [],
      menus: {
        account: [],
        administrator: []
      }
    }
  }
  mergeTitle(packageJSON, dashboardJSON, applicationJSON)
  if (dashboardJSON && dashboardJSON.dashboard) {
    mergeScriptArray(packageJSON, dashboardJSON, 'content')
    mergeScriptArray(packageJSON, dashboardJSON, 'server')
    mergeScriptArray(packageJSON, dashboardJSON, 'proxy')
    mergeModuleArray(packageJSON, dashboardJSON)
  }
  if (applicationJSON && applicationJSON.dashboard) {
    mergeScriptArray(packageJSON, applicationJSON, 'content')
    mergeScriptArray(packageJSON, applicationJSON, 'server')
    mergeScriptArray(packageJSON, applicationJSON, 'proxy')
    mergeModuleArray(packageJSON, applicationJSON)
  }
  mergeSpecialHTML(packageJSON, '@layeredapps/dashboard')
  mergeSpecialHTML(packageJSON)
  mergeHTMLFileMenuLinks(packageJSON)
  for (const moduleName of packageJSON.dashboard.moduleNames) {
    mergeHTMLFileMenuLinks(packageJSON, moduleName)
  }
  mergeHTMLFileMenuLinks(packageJSON, '@layeredapps/dashboard')
  return packageJSON
}

function mergeTitle (packageJSON, dashboardJSON, applicationJSON) {
  if (applicationJSON && applicationJSON.dashboard) {
    packageJSON.dashboard.title = applicationJSON.dashboard.title
  }
  if (dashboardJSON && dashboardJSON.dashboard) {
    packageJSON.dashboard.title = packageJSON.dashboard.title || dashboardJSON.dashboard.title
  }
}

function mergeSpecialHTML (baseJSON, moduleName) {
  const files = ['error.html', 'redirect.html', 'template.html']
  if (!moduleName) {
    for (const file of files) {
      const rootFilePath = path.join(global.applicationPath, file)
      if (fs.existsSync(rootFilePath)) {
        const key = file.replace('.html', 'HTML')
        baseJSON.dashboard[`${key}Path`] = rootFilePath
        baseJSON.dashboard[key] = fs.readFileSync(rootFilePath).toString()
      }
    }
    return
  }
  for (const file of files) {
    let filePath
    try {
      filePath = require.resolve(path.join(moduleName, file))
    } catch (error) {
    }
    if (filePath) {
      const key = file.replace('.html', 'HTML')
      baseJSON.dashboard[`${key}Path`] = filePath
      baseJSON.dashboard[key] = fs.readFileSync(filePath).toString()
    }
  }
}

function mergeHTMLFileMenuLinks (baseJSON, moduleName) {
  if (!moduleName) {
    const rootAccountMenuHTMLPath = path.join(global.applicationPath, 'menu-account.html')
    if (fs.existsSync(rootAccountMenuHTMLPath)) {
      baseJSON.dashboard.menus.account.push(fs.readFileSync(rootAccountMenuHTMLPath).toString())
    }
    const rootAdministratorMenuHTMLPath = path.join(global.applicationPath, 'menu-administrator.html')
    if (fs.existsSync(rootAdministratorMenuHTMLPath)) {
      baseJSON.dashboard.menus.administrator.push(fs.readFileSync(rootAdministratorMenuHTMLPath).toString())
    }
    return
  }
  let moduleAccountMenuHTMLPath
  try {
    moduleAccountMenuHTMLPath = require.resolve(path.join(moduleName, 'menu-account.html'))
  } catch (error) {
  }
  if (moduleAccountMenuHTMLPath) {
    baseJSON.dashboard.menus.account.push(fs.readFileSync(moduleAccountMenuHTMLPath).toString())
  }
  let moduleAdministratorMenuHTMLPath
  try {
    moduleAdministratorMenuHTMLPath = require.resolve(path.join(moduleName, 'menu-administrator.html'))
  } catch (error) {
  }
  if (moduleAdministratorMenuHTMLPath) {
    baseJSON.dashboard.menus.administrator.push(fs.readFileSync(moduleAdministratorMenuHTMLPath).toString())
  }
}

function mergeScriptArray (baseJSON, otherJSON, scriptType) {
  if (!otherJSON.dashboard[scriptType] || !otherJSON.dashboard[scriptType].length) {
    return
  }
  for (const i in otherJSON.dashboard[scriptType]) {
    let absolutePath = path.join(global.applicationPath, otherJSON.dashboard[scriptType][i])
    if (!fs.existsSync(absolutePath)) {
      try {
        absolutePath = require.resolve(otherJSON.dashboard[scriptType][i])
      } catch (error) {
        Log.error('could not find script', otherJSON.dashboard[scriptType][i])
        throw new Error('invalid-' + scriptType + '-script')
      }
    }
    if (baseJSON.dashboard[`${scriptType}FilePaths`].indexOf(absolutePath) > -1) {
      continue
    }
    if (process.env.NODE_ENV === 'testing' && global.testingPackageJSON) {
      baseJSON.dashboard[scriptType].push(absolutePath)
      baseJSON.dashboard[`${scriptType}FilePaths`].push(absolutePath)
      continue
    }
    baseJSON.dashboard[scriptType].push(loadModuleFile(otherJSON.name, absolutePath))
    baseJSON.dashboard[`${scriptType}FilePaths`].push(absolutePath)
  }
}

function mergeModuleArray (baseJSON, otherJSON) {
  if (!otherJSON.dashboard.modules || !otherJSON.dashboard.modules.length) {
    return
  }
  for (const i in otherJSON.dashboard.modules) {
    const moduleName = otherJSON.dashboard.modules[i]
    if (moduleName === '@layeredapps/dashboard') {
      continue
    }
    if (otherJSON && moduleName === otherJSON.name) {
      continue
    }
    if (baseJSON.dashboard.modules.indexOf(moduleName) > -1) {
      continue
    }
    const moduleJSON = loadModuleFile(moduleName, 'package.json')
    if (!moduleJSON) {
      Log.error('could not find module', moduleName)
      throw new Error('invalid-module')
    }
    if (baseJSON.dashboard.moduleNames.indexOf(moduleName) > -1) {
      continue
    }
    baseJSON.dashboard.modules.push(loadModule(moduleName))
    baseJSON.dashboard.moduleNames.push(moduleName)
    baseJSON.dashboard.moduleVersions.push(moduleJSON.version)
    mergeScriptArray(baseJSON, moduleJSON, 'content')
    mergeScriptArray(baseJSON, moduleJSON, 'server')
    mergeScriptArray(baseJSON, moduleJSON, 'proxy')
    mergeSpecialHTML(baseJSON, moduleName)
    mergeModuleArray(baseJSON, moduleJSON)
  }
}

function loadApplicationJSON () {
  const filePath = path.join(global.applicationPath, 'package.json')
  if (fs.existsSync(filePath)) {
    return JSON.parse(fs.readFileSync(filePath))
  }
  return null
}

function loadModule (moduleName) {
  if (global.testModuleJSON && global.testModuleJSON[moduleName]) {
    return global.testModuleJSON[moduleName]
  }
  let modulePath
  try {
    modulePath = require.resolve(moduleName)
  } catch (error) {
  }
  if (modulePath) {
    return require(modulePath)
  }
  const rootPath = path.join(global.applicationPath, 'node_modules', moduleName)
  if (fs.existsSync(rootPath)) {
    return require(rootPath)
  }
  Log.error('missing module', moduleName)
  throw new Error('missing-module-file')
}

function loadModuleFile (moduleName, file) {
  if (global.testModuleJSON && global.testModuleJSON[moduleName]) {
    global.testModuleJSON[moduleName].files = global.testModuleJSON[moduleName].files || {}
    return global.testModuleJSON[moduleName].files[file]
  }
  // resolve module-name/path/to/file.js
  let modulePath
  try {
    modulePath = require.resolve(moduleName)
  } catch (error) {
  }
  if (modulePath) {
    const filePath = path.join(modulePath.replace('index.js', ''), file)
    if (file.endsWith('.js') || file.endsWith('.json')) {
      return require(filePath)
    }
    return fs.readFileSync(filePath).toString()
  }
  // resolve root path
  const rootPath = path.join(global.applicationPath, file)
  if (fs.existsSync(rootPath)) {
    if (rootPath.endsWith('.js')) {
      return require(rootPath)
    }
    return fs.readFileSync(rootPath).toString()
  }
  // resolve absolute path
  let absolutePath
  try {
    absolutePath = require.resolve(file)
  } catch (error) {
  }
  if (absolutePath) {
    if (absolutePath.endsWith('.js')) {
      return require(absolutePath)
    }
    return fs.readFileSync(absolutePath).toString()
  }
  Log.error('missing module file', file)
  throw new Error('missing-module-file')
}
