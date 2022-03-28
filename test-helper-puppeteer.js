const fs = require('fs')
const Log = require('./src/log.js')('dashboard-test-helper-puppeteer')
const path = require('path')
const puppeteer = require('puppeteer')
const util = require('util')
const wait = util.promisify(function (amount, callback) {
  if (amount && !callback) {
    callback = amount
    amount = null
  }
  return setTimeout(callback, amount || 1)
})
module.exports = {
  fetch,
  fill,
  close: () => {
    if (browser && browser.close) {
      browser.close()
      browser = null
    }
  }
}

let devices, allDevices, browser

async function fetch (method, req) {
  allDevices = allDevices || require('puppeteer/lib/cjs/puppeteer/common/DeviceDescriptors.js')
  devices = devices || [{
    name: 'Desktop',
    userAgent: 'Desktop browser',
    viewport: {
      width: 1920,
      height: 1080,
      deviceScaleFactor: 1,
      isMobile: false,
      hasTouch: false,
      isLandscape: false
    }
  },
  allDevices.devicesMap['iPad Pro'],
  allDevices.devicesMap['iPad Mini'],
  allDevices.devicesMap['Pixel 2 XL'],
  allDevices.devicesMap['iPhone SE']
  ]
  browser = await relaunchBrowser()
  const result = {}
  const page = await launchBrowserPage()
  await emulate(page, devices[0])
  page.on('error', (msg) => {
    if (msg && msg.text) {
      Log.error('puppeteer page error', msg.text())
    } else {
      Log.error('puppeteer page error', msg)
    }
  })
  page.on('console', (msg) => {
    if (msg && msg.text) {
      Log.error('puppeteer console msg', msg.text())
    } else {
      Log.error('puppeteer console msg', msg)
    }
  })
  // these huge timeouts allow webhooks to be received, in production
  // you'd send an email with a link or otherwise notify your user
  // asynchronously but tests wait for webhooks to be received
  await page.setDefaultTimeout(3600000)
  await page.setDefaultNavigationTimeout(3600000)
  await page.setBypassCSP(true)
  await page.setRequestInterception(true)
  page.on('request', async (request) => {
    await request.continue()
  })
  let html
  page.on('response', async (response) => {
    const status = await response.status()
    if (status === 302) {
      const headers = response.headers()
      result.redirect = headers.location
    }
    return status === 200
  })
  if (req.screenshots) {
    if (req.account) {
      await setCookie(page, req)
      await gotoURL(page, `${global.dashboardServer}/home`)
    } else {
      await gotoURL(page, global.dashboardServer)
    }
    let screenshotNumber = 1
    let lastStep
    const languages = global.languages || []
    if (!languages.length) {
      languages.push('en')
    }
    for (const step of req.screenshots) {
      Log.info('screenshot step', JSON.stringify(step))
      if (req.screenshots.indexOf(step) > 0) {
        await wait(100)
      }
      if (step.save) {
        if (process.env.GENERATE_SCREENSHOTS && process.env.SCREENSHOT_PATH) {
          let firstTitle
          for (const language of languages) {
            global.language = language.code
            for (const device of devices) {
              await emulate(page, device)
              const thisTitle = await saveScreenshot(device, page, screenshotNumber, 'index', 'page', req.filename, firstTitle)
              firstTitle = firstTitle || thisTitle
            }
          }
        }
        screenshotNumber++
        continue
      }
      if (step.hover) {
        if (process.env.GENERATE_SCREENSHOTS && process.env.SCREENSHOT_PATH) {
          let firstTitle
          for (const language of languages) {
            for (const device of devices) {
              global.language = language.code
              await emulate(page, device)
              await execute('hover', page, step.hover)
              const thisTitle = await saveScreenshot(device, page, screenshotNumber, 'hover', step.hover, req.filename, firstTitle)
              firstTitle = firstTitle || thisTitle
            }
          }
        } else {
          await execute('hover', page, step.hover)
        }
        screenshotNumber++
      } else if (step.click) {
        if (process.env.GENERATE_SCREENSHOTS && process.env.SCREENSHOT_PATH) {
          let firstTitle
          for (const language of languages) {
            global.language = language.code
            for (const device of devices) {
              await emulate(page, device)
              if (lastStep && lastStep.hover === '#account-menu-container') {
                await execute('hover', page, '#account-menu-container')
              } else if (lastStep && lastStep.hover === '#administrator-menu-container') {
                await execute('hover', page, '#administrator-menu-container')
              }
              await execute('hover', page, step.click)
              await execute('focus', page, step.click)
              const thisTitle = await saveScreenshot(device, page, screenshotNumber, 'click', step.click, req.filename, firstTitle)
              firstTitle = firstTitle || thisTitle
            }
          }
        } else {
          if (lastStep && lastStep.hover === '#account-menu-container') {
            await execute('hover', page, '#account-menu-container')
          } else if (lastStep && lastStep.hover === '#administrator-menu-container') {
            await execute('hover', page, '#administrator-menu-container')
          }
          await execute('hover', page, step.click)
        }
        screenshotNumber++
        if (step.waitBefore) {
          await step.waitBefore(page)
        }
        html = await page.content()
        await execute('click', page, step.click)
        if (step.waitAfter) {
          await step.waitAfter(page)
        } else {
          await page.waitForNavigation((response) => {
            const status = response.status()
            return status === 200
          })
        }
      } else if (step.fill) {
        if (step.waitBefore) {
          await step.waitBefore(page)
        }
        if (process.env.GENERATE_SCREENSHOTS && process.env.SCREENSHOT_PATH) {
          let firstTitle
          for (const language of languages) {
            global.language = language.code
            for (const device of devices) {
              await emulate(page, device, req)
              if (step.waitFormLoad) {
                await step.waitFormLoad(page)
              }
              await fill(page, step.fill, step.body || req.body, req.uploads)
              await execute('hover', page, req.button || '#submit-button')
              const thisTitle = await saveScreenshot(device, page, screenshotNumber, 'submit', step.fill, req.filename, firstTitle)
              firstTitle = firstTitle || thisTitle
            }
          }
        } else {
          if (step.waitFormLoad) {
            await step.waitFormLoad(page)
          }
          await fill(page, step.fill, step.body || req.body, step.uploads || req.uploads)
        }
        screenshotNumber++
        await execute('focus', page, req.button || '#submit-button')
        html = await page.content()
        await execute('click', page, req.button || '#submit-button')
        if (step.waitAfter) {
          await step.waitAfter(page)
        } else {
          await page.waitForResponse((response) => {
            const status = response.status()
            return status === 200
          })
        }
        while (true) {
          try {
            html = await page.content()
            break
          } catch (error) {
          }
        }
        if (html.indexOf('<meta http-equiv="refresh"') > -1) {
          let redirectLocation = html.substring(html.indexOf(';url=') + 5)
          redirectLocation = redirectLocation.substring(0, redirectLocation.indexOf('"'))
          result.redirect = redirectLocation
        }
      }
      lastStep = step
    }
    if (process.env.GENERATE_SCREENSHOTS && process.env.SCREENSHOT_PATH) {
      let firstTitle
      for (const language of languages) {
        global.language = language.code
        for (const device of devices) {
          await emulate(page, device)
          const thisTitle = await saveScreenshot(device, page, screenshotNumber, 'complete', null, req.filename, firstTitle)
          firstTitle = firstTitle || thisTitle
        }
      }
    }
    screenshotNumber++
  } else {
    if (req.account) {
      await setCookie(page, req)
    }
    await gotoURL(page, `${global.dashboardServer}${req.url}`)
    if (method === 'POST') {
      if (req.waitBefore) {
        await req.waitBefore(page)
      }
      await fill(page, req.fill || '#submit-form', req.body, req.uploads)
      await execute('hover', page, req.button || '#submit-button')
      await execute('click', page, req.button || '#submit-button')
      if (req.waitAfter) {
        await req.waitAfter(page)
      } else {
        await page.waitForResponse((response) => {
          const status = response.status()
          return status === 200
        })
      }
      await wait(1000)
    }
  }
  while (true) {
    try {
      html = await page.content()
      break
    } catch (error) {
    }
  }
  if (!result.redirect && html.indexOf('<meta http-equiv="refresh"') > -1) {
    let redirectLocation = html.substring(html.indexOf(';url=') + 5)
    redirectLocation = redirectLocation.substring(0, redirectLocation.indexOf('"'))
    result.redirect = redirectLocation
  }
  if (result.redirect && !result.redirect.startsWith('/account/signin')) {
    await gotoURL(page, `${global.dashboardServer}${result.redirect}`)
    html = await page.content()
  }
  result.html = html
  await page.close()
  return result
}

async function relaunchBrowser () {
  if (browser && browser.close) {
    await browser.close()
    browser = null
  }
  const launchOptions = {
    headless: !(process.env.SHOW_BROWSERS === 'true'),
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--window-size=1920,1080',
      '--incognito',
      '--disable-dev-shm-usage',
      '--disable-features=site-per-process'
    ],
    slowMo: 10
  }
  if (process.env.CHROMIUM_EXECUTABLE) {
    launchOptions.executablePath = process.env.CHROMIUM_EXECUTABLE
  }
  while (!browser) {
    try {
      browser = await puppeteer.launch(launchOptions)
      if (browser) {
        return browser
      }
    } catch (error) {
      Log.error('error instantiating browser', error.toString())
    }
    await wait(50)
  }
}

async function launchBrowserPage () {
  let pages
  while (!pages) {
    try {
      pages = await browser.pages()
    } catch (error) {
    }
    if (pages && pages.length) {
      break
    }
    await wait(50)
  }
  if (pages && pages.length) {
    return pages[0]
  }
  let page
  while (!page) {
    try {
      page = await browser.newPage()
    } catch (error) {
    }
    if (page) {
      return page
    }
    await wait(50)
  }
}

async function gotoURL (page, url) {
  while (true) {
    try {
      await page.goto(url, { waitLoad: true, waitNetworkIdle: true })
      let content
      while (!content || !content.length) {
        content = await page.content()
      }
      return true
    } catch (error) {
      Log.error('puppeteer gotoURL error', error.toString())
    }
    await wait(50)
  }
}

async function setCookie (page, req) {
  const cookies = await page.cookies()
  if (cookies.length) {
    return
  }
  if (!req.session) {
    return
  }
  const cookie = { value: req.session.sessionid, session: true, name: 'sessionid', url: global.dashboardServer }
  const cookie2 = { value: req.session.token, session: true, name: 'token', url: global.dashboardServer }
  while (true) {
    try {
      await page.setCookie(cookie)
      break
    } catch (error) {
    }
    await wait(50)
  }
  while (true) {
    try {
      await page.setCookie(cookie2)
      return
    } catch (error) {
    }
    await wait(50)
  }
}

async function emulate (page, device) {
  while (true) {
    try {
      await page.emulate(device)
      return
    } catch (error) {
    }
    await wait(50)
  }
}

const screenshotCache = {
}

async function saveScreenshot (device, page, number, action, identifier, scriptName, overrideTitle) {
  Log.info('taking screenshot', number, action, identifier, scriptName)
  let filePath = scriptName.substring(scriptName.indexOf('/src/www/') + '/src/www/'.length)
  filePath = filePath.substring(0, filePath.lastIndexOf('.test.js'))
  filePath = path.join(process.env.SCREENSHOT_PATH, filePath)
  if (!fs.existsSync(filePath)) {
    createFolderSync(filePath)
  }
  let title
  if (identifier === '#submit-form') {
    title = 'form'
  } else if (identifier === '#submit-button') {
    let text = await page.evaluate((identifier) => {
      const element = document.querySelector(identifier)
      if (element.innerText && element.innerHTML.indexOf('>') === -1) {
        return element.innerText
      }
      if (element.title) {
        return element.title
      }
      for (let i = 0, len = element.children.length; i < len; i++) {
        if (element.children[i].innerText) {
          return element.children[i].innerText
        }
        if (element.children[i].title) {
          return element.children[i].title
        }
      }
    }, identifier)
    if (text.indexOf('_') > -1) {
      text = text.substring(0, text.indexOf('_'))
    } else {
      text = text.split(' ').join('-').toLowerCase()
    }
    title = text
  } else if (identifier && identifier[0] === '/') {
    let text = await page.evaluate((identifier, dashboardServer) => {
      const links = document.getElementsByTagName('a')
      for (const link of links) {
        if (link.href === identifier ||
          link.href.startsWith(`${identifier}?`) ||
          link.href.startsWith(`${identifier}&`) ||
          link.href === `${dashboardServer}${identifier}` ||
          link.href.startsWith(`${dashboardServer}${identifier}?`) ||
          link.href.startsWith(`${dashboardServer}${identifier}&`)) {
          if (link.innerText && link.innerHTML.indexOf('>') === -1) {
            return link.innerText
          }
          if (link.title) {
            return link.title
          }
          for (let i = 0, len = link.children.length; i < len; i++) {
            if (link.children[i].innerText) {
              return link.children[i].innerText
            }
            if (link.children[i].title) {
              return link.children[i].title
            }
          }
        }
      }
    }, identifier, global.dashboardServer)
    if (text.indexOf('_') > -1) {
      text = text.substring(0, text.indexOf('_'))
    } else {
      text = text.split(' ').join('-').toLowerCase()
    }
    title = text
  } else if (action === 'index') {
    title = 'index'
  } else if (identifier) {
    title = 'form'
  } else {
    title = ''
  }
  let filename
  if (overrideTitle) {
    filename = `${number}-${action}-${overrideTitle}-${device.name.split(' ').join('-')}-${global.language}.png`.toLowerCase()
  } else {
    if (title) {
      filename = `${number}-${action}-${title}-${device.name.split(' ').join('-')}-${global.language}.png`.toLowerCase()
    } else {
      filename = `${number}-${action}-${device.name.split(' ').join('-')}-${global.language}.png`.toLowerCase()
    }
  }
  if (screenshotCache[filename]) {
    return fs.writeFileSync(`${filePath}/${filename}`, screenshotCache[filename])
  }
  await page.screenshot({ path: `${filePath}/${filename}`, type: 'png' })
  if ((number === 1 && action === 'hover') ||
      (number === 2 && action === 'click')) {
    screenshotCache[filename] = fs.readFileSync(`${filePath}/${filename}`)
  }
  return title
}

async function execute (action, page, identifier) {
  return page.evaluate((identifier, action, dashboardServer) => {
    if (identifier.startsWith('/')) {
      const links = document.getElementsByTagName('a')
      for (const a of links) {
        if (a.href === identifier ||
          a.href.startsWith(`${identifier}?`) ||
          a.href.startsWith(`${identifier}&`) ||
          a.href === `${dashboardServer}${identifier}` ||
          a.href.startsWith(`${dashboardServer}${identifier}?`) ||
          a.href.startsWith(`${dashboardServer}${identifier}&`)) {
          if (action === 'hover') {
            a.focus()
          } else if (action === 'click') {
            a.click()
          }
        }
      }
    }
    if (identifier.startsWith('#')) {
      const element = document.querySelector(identifier)
      const button = element.firstChild
      if (button && button.tagName === 'button') {
        return button.click()
      }
      if (action === 'hover') {
        element.focus()
      } else if (action === 'click') {
        element.click()
      }
      return
    }
  }, identifier, action, global.dashboardServer)
}

async function fill (page, fieldContainer, body, uploads) {
  if (!body && !uploads) {
    return
  }
  if (uploads) {
    for (const field in uploads) {
      const element = await page.$(`#${field}`)
      if (element) {
        await element.uploadFile(uploads[field].path)
      }
      continue
    }
  }
  if (!body) {
    return
  }
  return page.evaluate((fieldContainer, body) => {
    const container = document.querySelector(fieldContainer || '#submit-form')
    for (const field in body) {
      const element = container.querySelector(`#${field}`)
      if (!element) {
        const checkboxes = container.querySelectorAll('input[type=checkbox]')
        if (checkboxes && checkboxes.length) {
          for (const checkbox of checkboxes) {
            if (checkbox.name !== field) {
              continue
            }
            if (checkbox.value === body[field]) {
              checkbox.checked = true
            } else if (!body[field]) {
              checkbox.checked = false
            }
          }
        }
        const radios = container.querySelectorAll('input[type=radio]')
        if (radios && radios.length) {
          for (const radio of radios) {
            if (radio.name !== field) {
              continue
            }
            if (radio.value === body[field]) {
              radio.checked = true
            } else if (!body[field]) {
              radio.checked = false
            }
          }
        }
        continue
      }
      element.focus()
      if (element.tagName === 'TEXTAREA') {
        element.value = body[field]
      } else if (element.tagName === 'SELECT') {
        for (let i = 0; i < element.options.length; i++) {
          if (element.options[i].text === body[field] || element.options[i].value === body[field]) {
            element.selectedIndex = i;
            break;
          }
        }
      } else if (element.tagName === 'INPUT') {
        if (element.type === 'radio' || element.type === 'checkbox') {
          if (body[field]) {
            element.checked = true
          } else {
            element.checked = false
          }
        } else {
          if (body[field]) {
            element.value = body[field]
          } else {
            element.value = ''
          }
        }
      } else {
        // inaccessible input fields such as Stripe payment information
        element.click()
        for (let i = 0, len = 100; i < len; i++) {
          element.dispatchEvent(new KeyboardEvent("keydown", {
            "key": "Backspace",
            "keyCode": 8,
            "which": 8,
            "code": "Backspace",
            "location": 0,
            "altKey": false,
            "ctrlKey": false,
            "metaKey": false,
            "shiftKey": false,
            "repeat": false
          }))
        }
        const keyCodes = {
          '0': { "key": "0", "keyCode": 48, "which": 48, "code": "Digit0", "location": 0 },
          '1': { "key": "1", "keyCode": 49, "which": 49, "code": "Digit1", "location": 0 },
          '2': { "key": "2", "keyCode": 50, "which": 50, "code": "Digit2", "location": 0 },
          '3': { "key": "3", "keyCode": 51, "which": 51, "code": "Digit3", "location": 0 },
          '4': { "key": "4", "keyCode": 52, "which": 52, "code": "Digit4", "location": 0 },
          '5': { "key": "5", "keyCode": 53, "which": 53, "code": "Digit5", "location": 0 },
          '6': { "key": "6", "keyCode": 54, "which": 54, "code": "Digit6", "location": 0 },
          '7': { "key": "7", "keyCode": 55, "which": 55, "code": "Digit7", "location": 0 },
          '8': { "key": "8", "keyCode": 56, "which": 56, "code": "Digit8", "location": 0 },
          '9': { "key": "9", "keyCode": 57, "which": 57, "code": "Digit9", "location": 0 },
          'a': { "key": "a", "keyCode": 65, "which": 65, "code": "KeyA", "location": 1 },
          'b': { "key": "b", "keyCode": 65, "which": 66, "code": "KeyB", "location": 1 },
          'c': { "key": "c", "keyCode": 65, "which": 67, "code": "KeyC", "location": 1 },
          'd': { "key": "d", "keyCode": 65, "which": 68, "code": "KeyD", "location": 1 },
          'e': { "key": "e", "keyCode": 65, "which": 69, "code": "KeyE", "location": 1 },
          'f': { "key": "f", "keyCode": 65, "which": 70, "code": "KeyF", "location": 1 },
          'g': { "key": "g", "keyCode": 65, "which": 71, "code": "KeyG", "location": 1 },
          'h': { "key": "h", "keyCode": 65, "which": 72, "code": "KeyH", "location": 1 },
          'i': { "key": "i", "keyCode": 65, "which": 73, "code": "KeyI", "location": 1 },
          'j': { "key": "j", "keyCode": 65, "which": 74, "code": "KeyJ", "location": 1 },
          'k': { "key": "k", "keyCode": 65, "which": 75, "code": "KeyK", "location": 1 },
          'l': { "key": "l", "keyCode": 65, "which": 76, "code": "KeyL", "location": 1 },
          'm': { "key": "m", "keyCode": 65, "which": 77, "code": "KeyM", "location": 1 },
          'n': { "key": "n", "keyCode": 65, "which": 78, "code": "KeyN", "location": 1 },
          'o': { "key": "o", "keyCode": 65, "which": 79, "code": "KeyO", "location": 1 },
          'p': { "key": "p", "keyCode": 65, "which": 80, "code": "KeyP", "location": 1 },
          'q': { "key": "q", "keyCode": 65, "which": 81, "code": "KeyQ", "location": 1 },
          'r': { "key": "r", "keyCode": 65, "which": 82, "code": "KeyR", "location": 1 },
          's': { "key": "s", "keyCode": 65, "which": 83, "code": "KeyS", "location": 1 },
          't': { "key": "t", "keyCode": 65, "which": 84, "code": "KeyT", "location": 1 },
          'u': { "key": "u", "keyCode": 65, "which": 85, "code": "KeyU", "location": 1 },
          'v': { "key": "v", "keyCode": 65, "which": 86, "code": "KeyV", "location": 1 },
          'w': { "key": "w", "keyCode": 65, "which": 87, "code": "KeyW", "location": 1 },
          'x': { "key": "x", "keyCode": 65, "which": 88, "code": "KeyX", "location": 1 },
          'y': { "key": "y", "keyCode": 65, "which": 89, "code": "KeyY", "location": 1 },
          'z': { "key": "z", "keyCode": 65, "which": 90, "code": "KeyZ", "location": 1 },
             
        }
        if (field.endsWith('-container')) {
          element.focus()
        }
        for (const char of body[field]) {
          element.dispatchEvent(new KeyboardEvent("keydown", keyCodes[char]))
        }
      }
  
    }  
  }, fieldContainer, body)
}

function createFolderSync (folderPath) {
  const nestedParts = folderPath.split('/')
  let nestedPath = ''
  for (const part of nestedParts) {
    nestedPath += `/${part}`
    if (!fs.existsSync(nestedPath)) {
      fs.mkdirSync(nestedPath)
    }
  }
}
