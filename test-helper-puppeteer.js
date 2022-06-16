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
  close: async () => {
    if (browser && browser.close) {
      await browser.close()
      browser = null
    }
  }
}

let devices, browser

async function fetch (method, req) {
  const deviceMap = allDevices || require('puppeteer/lib/cjs/puppeteer/common/DeviceDescriptors.js')._devicesMap
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
  deviceMap['iPad Pro'],
  deviceMap['iPad Mini'],
  deviceMap['Pixel 2 XL'],
  deviceMap['iPhone SE']
  ]
  browser = await relaunchBrowser()
  const result = {}
  const page = await launchBrowserPage()
  await page.emulate(devices[0])
  page.on('error', (error) => {
    if (error && error.text) {
      Log.error('page error', error.text())
    } else {
      Log.error('page error', error)
    }
  })
  page.on('console', (message) => {
    if (message && message.text) {
      Log.info('console', message.text())
    } else {
      Log.info('console', message)
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
    const generateScreenshots = process.env.GENERATE_SCREENSHOTS === 'true'
    const colorSchemes = ['light', 'dark']
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
        if (generateScreenshots && process.env.SCREENSHOT_PATH) {
          let firstTitle
          for (const colorScheme of colorSchemes) {
            await page.emulateMediaFeatures([{ name: 'prefers-color-scheme', value: colorScheme }])
            for (const language of languages) {
              global.language = language.code
              for (const device of devices) {
                await page.emulate(device)
                await page.setViewport(device.viewport)
                const thisTitle = await saveScreenshot(device, page, screenshotNumber, 'index', 'page', req.filename, firstTitle, colorScheme)
                firstTitle = firstTitle || thisTitle
              }
            }
          }
        }
        screenshotNumber++
        continue
      }
      if (step.hover) {
        if (generateScreenshots && process.env.SCREENSHOT_PATH) {
          let firstTitle
          for (const colorScheme of colorSchemes) {
            await page.emulateMediaFeatures([{ name: 'prefers-color-scheme', value: colorScheme }])
            for (const language of languages) {
              for (const device of devices) {
                global.language = language.code
                await page.emulate(device)
                await page.setViewport(device.viewport)
                await execute('hover', page, step.hover)
                const thisTitle = await saveScreenshot(device, page, screenshotNumber, 'hover', step.hover, req.filename, firstTitle, colorScheme)
                firstTitle = firstTitle || thisTitle
              }
            }
          }
        } else {
          await execute('hover', page, step.hover)
        }
        screenshotNumber++
      } else if (step.click) {
        if (generateScreenshots && process.env.SCREENSHOT_PATH) {
          let firstTitle
          for (const colorScheme of colorSchemes) {
            await page.emulateMediaFeatures([{ name: 'prefers-color-scheme', value: colorScheme }])
            for (const language of languages) {
              global.language = language.code
              for (const device of devices) {
                await page.emulate(device)
                await page.setViewport(device.viewport)
                if (lastStep && lastStep.hover === '#account-menu-container') {
                  await execute('hover', page, '#account-menu-container')
                } else if (lastStep && lastStep.hover === '#administrator-menu-container') {
                  await execute('hover', page, '#administrator-menu-container')
                }
                await execute('hover', page, step.click)
                await execute('focus', page, step.click)
                const thisTitle = await saveScreenshot(device, page, screenshotNumber, 'click', step.click, req.filename, firstTitle, colorScheme)
                firstTitle = firstTitle || thisTitle
              }
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
        if (generateScreenshots && process.env.SCREENSHOT_PATH) {
          let firstTitle
          for (const colorScheme of colorSchemes) {
            await page.emulateMediaFeatures([{ name: 'prefers-color-scheme', value: colorScheme }])
            for (const language of languages) {
              global.language = language.code
              for (const device of devices) {
                await page.emulate(device)
                await page.setViewport(device.viewport)
                if (step.waitFormLoad) {
                  await step.waitFormLoad(page)
                }
                await fill(page, step.fill, step.body || req.body, req.uploads)
                await execute('hover', page, req.button || '#submit-button')
                const thisTitle = await saveScreenshot(device, page, screenshotNumber, 'submit', step.fill, req.filename, firstTitle, colorScheme)
                firstTitle = firstTitle || thisTitle
              }
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
    if (generateScreenshots && process.env.SCREENSHOT_PATH) {
      let firstTitle
      for (const colorScheme of colorSchemes) {
        await page.emulateMediaFeatures([{ name: 'prefers-color-scheme', value: colorScheme }])
        for (const language of languages) {
          global.language = language.code
          for (const device of devices) {
            await page.emulate(device)
            await page.setViewport(device.viewport)
            const thisTitle = await saveScreenshot(device, page, screenshotNumber, 'complete', null, req.filename, firstTitle, colorScheme)
            firstTitle = firstTitle || thisTitle
          }
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
  const launchArguments = [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--window-size=1920,1080',
    '--incognito',
    '--disable-dev-shm-usage',
    '--disable-features=site-per-process'
  ]
  const launchOptions = {
    headless: !(process.env.SHOW_BROWSERS === 'true'),
    args: launchArguments,
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

const screenshotCache = {
}

async function saveScreenshot (device, page, number, action, identifier, scriptName, overrideTitle, colorScheme) {
  Log.info('taking screenshot', number, action, identifier, scriptName)
  global.language = global.language || 'en'
  let filePath = scriptName.substring(scriptName.indexOf('/src/www/') + '/src/www/'.length)
  filePath = filePath.substring(0, filePath.lastIndexOf('.test.js'))
  filePath = path.join(process.env.SCREENSHOT_PATH, filePath)
  if (!fs.existsSync(filePath)) {
    createFolderSync(filePath)
  }
  let title
  if (identifier === '#submit-form') {
    title = 'form'
  } else if (identifier && identifier.startsWith('#')) {
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
    } else if (text.indexOf('\n') > -1) {
      text = text.substring(0, text.indexOf('\n'))
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
    } else if (text.indexOf('\n') > -1) {
      text = text.substring(0, text.indexOf('\n'))
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
    filename = `${number}-${action}-${overrideTitle}-${device.name.split(' ').join('-')}-${global.language}-${colorScheme}.png`.toLowerCase()
  } else {
    if (title) {
      filename = `${number}-${action}-${title}-${device.name.split(' ').join('-')}-${global.language}-${colorScheme}.png`.toLowerCase()
    } else {
      filename = `${number}-${action}-${device.name.split(' ').join('-')}-${global.language}-${colorScheme}.png`.toLowerCase()
    }
  }
  if (screenshotCache[filename]) {
    return fs.writeFileSync(`${filePath}/${filename}`, screenshotCache[filename])
  }
  await page.screenshot({ path: `${filePath}/${filename}`, type: 'png', fullPage: true })
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
        if (identifier === '#administrator-menu-container' || identifier === '#account-menu-container') {
          element.click()
        } else if (element.hover) {
          element.hover()
        } else if (element.focus) {
          element.focus()
        }
      } else if (action === 'click') {
        element.click()
      }
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
  await page.evaluate((fieldContainer, body) => {
    const container = document.querySelector(fieldContainer || '#submit-form')
    for (const field in body) {
      if (body[field] && body[field].type) {
        continue
      }
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
            element.selectedIndex = i
            break
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
      }
    }
  }, fieldContainer, body)
  for (const field in body) {
    if (!body[field] || !body[field].type) {
      continue
    }
    // inaccessible input fields such as Stripe payment information
    const element = await page.$(`#${field}`)
    await element.click()
    await wait(1)
    for (let i = 0; i < 100; i++) {
      await page.keyboard.press('Backspace')
      await wait(1)
    }
    for (const char of body[field].value) {
      await element.focus()
      await wait(1)
      await element.type(char)
      await wait(1)
    }
  }
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
