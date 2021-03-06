# Documentation for Dashboard

#### Shortcuts

- [Documentation website](https://layeredapps.github.io)
- [Dashboard documentation](https://layeredapps.github.io/dashboard)
- [UI screenshots](https://layeredapps.github.io/dashboard-ui)
- [API documentation](https://layeredapps.github.io/dashboard-api)
- [Environment configuration](https://layeredapps.github.io/dashboard-configuration)
- [Example web app](https://github.com/layeredapps/example-web-app)
- [Example subscription web app](https://github.com/layeredapps/example-subscription-web-app)
- [Dashboard hosting at Layered Apps](https://layeredapps.com)

#### Index

- [Introduction](#introduction)
- [Hosting Dashboard yourself](#hosting-dashboard-yourself)
- [Customize Dashboard appearance](#customizing-dashboard-appearance)
- [Customize registration information](#customize-registration-information)
- [Configuring Dashboard](#configuring-dashboard)
- [Provided server, content and proxy handlers](#provided-server-content-and-proxy-handlers)
- [Dashboard modules](#dashboard-modules)
- [Access the API from your application server](#access-the-api)
- [Localization](#localization)
- [Storage backends](#storage-backends)
- [Storage caching](#storage-caching)
- [XSS and CSRF protection](#xss-and-csrf-protection)
- [Logging](#logging)
- [Creating modules for Dashboard](#creating-modules-for-dashboard)
- [Testing](#testing)
- [Github repository](https://github.com/layeredapps/dashboard)
- [NPM package](https://npmjs.org/layeredapps/dashboard)

# Introduction

Web applications often require coding a user account system, organizations, subscriptions and other 'boilerplate' again and again.  

Dashboard packages everything web apps need into reusable, modular software.  It runs separately to your application so you have two web servers instead of one, and Dashboard fuses their content together to provide a single website or interface for your users.  To get started your web app just needs to serve something on `/` for your guest home page and `/home` for signed in users.

Dashboard is stateless and designed to scale 'horizontally', that is you can run multiple instances of your Dashboard server in parallel to handle user requests using Heroku, Render, Fly, Digital Ocean's App Platform, etc.  Managed hosting is available at [Layered Apps](https://layeredapps.com).

Your application server can return special HTML attributes and tags to interoperate with the Dashboard server.  Your content can be accessible to guests by specifying `<html data-auth="false">` and you can serve full-page content by specifying `<html data-template="false">` in your HTML.  Otherwise the routes will require authentication, and Dashboard will inject the template's header and navigation into the top of the page and merge the head tag's script and CSS references.

You can populate the template's navigation bar by including `<template id="navbar"></template>` with the links and any other HTML for your menu.

# Hosting Dashboard yourself

Dashboard requires NodeJS `16+` be installed.

    $ mkdir my-dashboard-server
    $ cd my-dashboard-server
    $ npm init
    $ npm install @layeredapps/dashboard
    $ echo "require('@layeredapps/dashboard').start(__dirname)" > main.js
    $ node main.js

# Customizing Dashboard appearance

Dashboard and module content is provided in HTML pages.  Your application server can serve two special CSS files at `/public/template-additional.css` and `/public/content-additional.css` to theme the template and pages to match your application design.

    /public/template-additional.css
    /public/content-additional.css

You can make structural changes to the template, redirect and error pages by serving your own pages from your application server.  Dashboard will try to fetch alternative HTML pages from your application server and use its own files if you do not have any:

    /template.html
    /error.html
    /redirect.html

The account and administrator drop-down menus are created from stub HTML files placed in Dashboard, modules, and your application server.  To add your own links serve a `/menu-account.html` and `/menu-administrator.html` on your application server with the HTML to include.

The account menu is assembled in this order:

1) Your application server's `/menu-account.html`
2) Any activated module's `/menu-account.html` files
3) Dashboard's `/menu-account.html`

The administrator menu is assembled in this order:

1) Your application server's `/menu-administrator.html`
2) Any activated module's `/menu-administrator.html` files
3) Dashboard's `/menu-administrator.html`

Dashboard will try to fetch alternative icons from your application server:

    /favicon.ico
    /public/favicon.ico
    /public/favicon-16x16.png
    /public/favicon-32x32.png
    /public/apple-touch-icon.png

# Customize registration information

By default users may register with just a username and password, both of which are encrypted so they cannot be used for anything but signing in.  You can specify some personal information fields to require in an environment variable:

    REQUIRE_PROFILE=true
    PROFILE_FIELDS=any,combination

These fields are supported by the registration form:

| Field         | Description                |
|---------------|----------------------------|
| full-name     | First and last name        |
| contact-email | Contact email              |
| display-name  | Name to display to users   |
| display-email | Email to display to users  |
| dob           | Date of birth              |
| location      | Location description       |
| phone         | Phone number               |
| company-name  | Company name               |
| website       | Website                    |
| occupation    | Occupation                 |

# Configuring Dashboard

Dashboard is configured with a combination of environment variables and hard-coded settings in your `package.json`:

    {
        "dashboard": {
            "title": "Title to place in Template",
            "modules: [
                "@layeredapps/organizations",
                "@layeredapps/stripe-connect"
            ],
            "server": [
                "/src/to/script/to/run/receiving/requests.js"
            ],
            "content": [
                "/src/to/script/to/modify/content.js"
            ],
            "proxy": [
                "/src/to/script/to/modify/proxy/requests.js
            ],
            "themeColor": "#abcdef",
            "tileColor": "#abcdef"
        }
    }

Server handlers can execute `before` and/or `after` a visitor is identified as a guest or user:

    module.exports = {
        before: async (req, res) => {
            // req.account is not set
            // req.session is not set
        },
        after: async (req, res) => {
            // req.account may be set
            // req.session may be set
        }
    }

Content handlers can adjust the `template` and `page` documents before they are served to the user:

    module.exports = {
        page: async (req, res, pageDoc) => {
            // adjust page before mixing with template
        },
        template: async (req, res, templateDoc) => {
            // page is now in `src-doc` of application iframe
        }
    }

Proxy handlers can add to the headers sent to your application servers:
    
    module.exports = async (req, proxyRequestOptions) => {
        proxyRequestOptions.headers.include = 'something'
    }

# Provided server, content and proxy handlers

Dashboard comes with some convenience scripts you can add to your `package.json`:

| Type     | Script path                                                                            | Description                                                                                                                                                                                                                                                                                                                                                                       |
|----------|----------------------------------------------------------------------------------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| proxy    | @layeredapps/dashboard/src/proxy/x-account.js                                          | Dashboard will bundle the user's Account object in `x-account` header.                                                                                                                                                                                                                                                                                                            |
| proxy    | @layeredapps/dashboard/src/proxy/x-csrf-token.js                                       | Dashboard will bundle a CSRF token specific to the user session and URL (truncated to `?`) that you can place in a hidden form input and compare when the form is submitted to prevent external websites from submitting your forms via "cross-site request forgery".  You can alternatively roll your own CSRF protection.                                                       |
| proxy    | @layeredapps/dashboard/src/proxy/x-profile.js                                          | Dashboard will bundle the user's Profile object in `x-account` header.                                                                                                                                                                                                                                                                                                            |
| proxy    | @layeredapps/dashboard/src/proxy/x-session.js                                          | Dashboard will bundle the user's Session object in `x-account` header.                                                                                                                                                                                                                                                                                                            |
| server   | @layeredapps/dashboard/src/server/allow-api-access.js                                  | Allows API access from the same domain eg via browser / AJAX.                                                                                                                                                                                                                                                                                                                     |
| server   | @layeredapps/dashboard/src/server/allow-api-access-cross-domain.js                     | Allows API access from third-party domains eg via browser / AJAX.                                                                                                                                                                                                                                                                                                                 |
| server   | @layeredapps/dashboard/src/server/allow-api-requests-from-application.js               | Allows your application server to query `/api/*` while Dashboard's API is not publicly shared.                                                                                                                                                                                                                                                                                    |
| server   | @layeredapps/dashboard/src/server/allow-api-requests-to-application.js                 | When an unknown `/api/*` request occurs it will be passed to your application server while Dashboard's API is not publicly shared.                                                                                                                                                                                                                                                |
| server   | @layeredapps/dashboard/src/server/check-before-delete-account.js                       | Require users complete steps, such as deleting subscriptions, before deleting their account.  Set a `CHECK_BEFORE_DELETE_ACCOUNT` path such as `/check-delete` on your Application server, Dashboard will query this API passing `?accountid=xxxxx` and you may respond with { "redirect": "/your-delete-requirements" } or { "redirect": false }" to enforce the requirements.   |
| server   | @layeredapps/dashboard/src/server/fetch-application-server-special-html.js             | Serve a custom `error.html`, `redirect.html`, `template.html`, `menu-account.html` or `menu-administrator.html` from your application server at `/FILE_NAME.html`.  Dashboard will cache this for 60 seconds or an amount you set in CACHE_APPLICATION_SERVER_FILES.                                                                                                              |
| server   | @layeredapps/dashboard/src/server/fetch-application-server-static-file.js              | Serve a custom `/robots.txt`, `/favicon.ico` or any `/public/` files from your application server.  Dashboard will cache this for 60 seconds or an amount you set in CACHE_APPLICATION_SERVER_FILES.                                                                                                                                                                              |

Dashboard includes some "private" content scripts that are configured automatically:

| Type     | Script path                                                                            | Description                                                                                                                                                                                                                                                                                                                                                                       |
|----------|----------------------------------------------------------------------------------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| content  | @layeredapps/dashboard/src/content/insert-csrf-token.js                                | Adds a CSRF token to Dashboard and module forms, this does not add CSRF tokens to your application's forms.                                                                                                                                                                                                                                                                       |
| content  | @layeredapps/dashboard/src/content/set-form-novalidate.js                              | When NODE_ENV=testing this adds "novalidate" to FORM attributes so input validation (eg required) does not occur so server error messages can be tested.                                                                                                                                                                                                                          |
| content  | @layeredapps/dashboard/src/content/set-form-return-url.js                              | Copies the 'return-url' from URL parameters to the FORM action if there is no pre-existing return-url defined in the FORM action.                                                                                                                                                                                                                                                 |
| server   | @layeredapps/dashboard/src/server/check-csrf-token.js                                  | Compares posted CSRF token to expected CSRF token and renders an error message if they are not matching.                                                                                                                                                                                                                                                                          |
| server   | @layeredapps/dashboard/src/server/check-xss-injection.js                               | Checks input for XSS injections when posting to Dashboard and module forms and APIs.  This does not check data posted to your application server since Dashboard does not know if you want HTML in user input.                                                                                                                                                                    |
| server   | @layeredapps/dashboard/src/server/hot-reload.js                                        | When HOT_RELOAD=true this forces files to be reloaded on each request so changes can be observed immediately without restarting the server.                                                                                                                                                                                                                                       |


# Dashboard modules

Dashboard is modular and by itself it provides only the signing in, account management and basic administration.  Modules add new pages and API routes for additional functionality.

| Name                                                                                            | Description                               |
|-------------------------------------------------------------------------------------------------|-------------------------------------------|
| [@layeredapps/maxmind-geoip](https://npmjs.com/package/layeredapps/maxmind-geoip)               | IP address-based geolocation by MaxMind   |
| [@layeredapps/organizations](https://npmjs.com/package/layeredapps/organizations)               | User created groups                       |
| [@layeredapps/maxmind-geoip](https://npmjs.com/package/layeredapps/maxmind-geoip)               | IP-to-country mapping by MaxMind          |
| [@layeredapps/stripe-connect](https://npmjs.com/package/layeredapps/stripe-connect)             | Marketplace functionality by Stripe       |
| [@layeredapps/stripe-subscriptions](https://npmjs.com/package/layeredapps/stripe-subscriptions) | SaaS functionality by Stripe              |
| [@layeredapps/oauth](https://npmjs.com/package/layeredapps/oauth)                               | Oauth framework for providers             |
| [@layeredapps/oauth-github](https://npmjs.com/package/layeredapps/oauth-github)                 | "Sign in with GitHub" using OAuth         |

Modules are NodeJS packages that you install with NPM:

    $ npm install @layeredapps/stripe-subscriptions

You need to notify Dashboard which modules you are using in `package.json` conffiguration:

    "dashboard": {
      "modules": [
        "@layeredapps/stripe-subscriptions"
      ]
    }

# Access the API

Dashboard and official modules are completely API-driven and you can access the same APIs on behalf of the user making requests.  You perform `GET`, `POST`, `PATCH`, and `DELETE` HTTP requests against the API endpoints to fetch or modify data.  You can use a shared secret `APPLICATION_SERVER_TOKEN` to verify requests between servers, both servers send it in an `x-application-server-token` header. 

By default the API is not accessible, you can allow total access to it with an `ENV` variable:

    "dashboard": {
      "server": [
        "@layeredapps/dashboard/src/server/allow-api-access.js"
      ]
    }
 
Or enable requests from your application server with a `server` script handler:

    "dashboard": {
      "server": [
        "@layeredapps/dashboard/src/server/internal-api-requests.js"
      ]
    }
 
Dashboard can also forward API requests to your own `/api/` routes:

    "dashboard": {
       "server": [
         "@layeredapps/dashboard/src/server/forward-api-requests.js"
       ]
    }

This example fetches the user's session information using NodeJS, you can do this with any language:

    const sessions = await proxy(`/api/user/sessions?accountid=${accountid}`, accountid, sessionid)

    const proxy = util.promisify((path, accountid, sessionid, callback) => {
        const requestOptions = {
            host: 'dashboard.example.com',
            path: path,
            port: '443',
            method: 'GET',
            headers: {
                'x-application-server': 'application.example.com',
                'x-application-server-token': process.env.APPLICATION_SERVER_TOKEN,
                'x-accountid': accountid,
                'x-sessionid': sessionid
            }
        }
        const proxyRequest = require('https').request(requestOptions, (proxyResponse) => {
            let body = ''
            proxyResponse.on('data', (chunk) => {
                body += chunk
            })
            return proxyResponse.on('end', () => {
                return callback(null, JSON.parse(body))
            })
        })
        proxyRequest.on('error', (error) => {
            return callback(error)
        })
        return proxyRequest.end()
      })
    }

# Storage backends

Dashboard uses the [Sequelize](github.com/sequelize/) library and is compatible with PostgreSQL, MySQL, MariaDB and SQLite.  Support for Microsoft SQL Server and IBM DB2 is possible but has issues ([MSSQL](https://github.com/layeredapps/dashboard/issues/5), [DB2](https://github.com/layeredapps/dashboard/issues/4)).  During development and testing you can use SQLITE in RAM by not setting a `DATABASE_FILE`.

| Storage     | Environment variables                          |
|-------------|------------------------------------------------|
| SQLITE      | STORAGE=sqlite                                 |
|             | DATABASE=dashboard                             |
|             | DATABASE_FILE=/path/file.sqlite                |
| POSTGRESQL  | STORAGE=postgresql                             |
|             | DATABASE_URL=postgres:/...                     |
| MariaDB     | STORAGE=mariadb                                |
|             | DATABASE_URL=mysql://...                       |
| MYSQL       | STORAGE=mysql                                  |
|             | DATABASE_URL=mysql://...                       |
| MSSQL       | STORAGE=mssql                                  |
|             | DATABASE_URL=Server=....                       |
| DB2         | STORAGE=db2                                    |
|             | DATABASE_URL=Server=...                        |

Dashboard modules are able to use their own storage settings:

    $ SUBSCRIPTIONS_STORAGE=postgresql \
      SUBSCRIPTIONS_DATABASE_URL=postgres://localhost:5432/subscriptions \
      ORGANIZATIONS_STORAGE=mysql \
      ORGANIZATIONS_DATABASE_URL=mysql:// \
      CONNECT_STORAGE=mssql \
      CONNECT_DATABASE_URL=... \
      node main.js

Read replication is supported for PostgreSQL, MariaDB, MySQL, MSSQL and DB2 by setting `STORAGE_REPLICATION` and then defining 1+ read-only databases.

    STORAGE_REPLICATION=true
    READ_DATABASE_URL1= 
    READ_DATABASE_URL2=

Connection pooling limits can be defined including on a per-module configuration:

    MAX_CONNECTIONS=3
    IDLE_CONNECTION_LIMIT=10000
    ORGANIZATIONS_MAX_CONNECTIONS=10
    ORGANIZATIONS_IDLE_CONNECTION_LIMIT=60000

# Storage caching

You can complement your storage backend with optional caching, either using RAM if you have a single instance of your Dashboard server, or Redis if you need a cache shared by multiple instances of your Dashboard server.

You can optionally use Redis as a cache, this is good for any storage on slow disks or for scaling Dashboard with multiple instances.

    $ STORAGE_CACHE=redis \
      REDIS_URL=redis://.... \ # use dedicated redis for cache
      node main.js

If you have a single Dashboard server you can cache within memory:

    $ CACHE=node \
      node main.js

# Usage metrics

By default usage metrics will be stored in your Dashboard database.  You can specify a Redis database to use instead.

You can optionally use Redis as a cache, this is good for any storage on slow disks.

    $ STORAGE_METRICS=redis \
      REDIS_URL=redis:/.... \
      node main.js

# Single and multiple Redis servers

You can specify a single Redis server used for both caching and metrics:

    $ STORAGE_METRICS=redis \
      STORAGE_CACHE=redis \
      REDIS_URL=redis:/.... \
      node main.js

You can specify separate servers:

    $ STORAGE_METRICS=redis \
      STORAGE_METRICS_REDIS_URL=redis:/.... \
      STORAGE_CACHE=redis \
      STORAGE_CACHE_REDIS_URL=redis:/.... \
      node main.js

# XSS and CSRF protection

Dashboard protects its own forms and module forms from "cross-site scripting" attacks and "cross-site request forgery", these attacks are essentially if someone enters javascript as a form value that is then executed when it is written on a page, or if they tried to submit a form from their website using an iframe.

Data that is posted to your application server is not restricted in case you have valid reasons to receive values that would not pass Dashboard's checks.  

You can use the `@layeredapps/dashboard/src/proxy/x-csrf-token.js` to receive a CSRF token for your own forms, and then when your forms are submitted you can check the posted value against the header value.  These tokens are generated based on the URL, a random value assigned to the session, and the user's session and account identifiers.

For XSS there are many language-specific libraries you can use to sanitize input.  Dashboard is written in NodeJS and uses [Yahoo's XSS-filters](https://www.npmjs.com/package/xss-filters) module.

# Logging

By default Dashboard does not have any active `console.*` being emitted.  You can enable logging with `LOG_LEVEL` containing a list of valid console.* methods.

    $ LOG_LEVEL=log,warn,info,error node main.js

Override Dashboard's logging by creating your own `log.js` in the root of your project:

    module.exports = (group) => {
      return {
        log: (message) => {
        },
        info: (message) => {
        },
        warn: (message) => {
        }
      }
    }

# Creating modules for Dashboard

A module is a NodeJS application with the same folder structure as Dashboard.  When Dashboard starts it scans its own files, and then any modules specified in the `package.json` to create a combined sitemap of UI and API routes.  You can browse the official modules' source to see examples.

    $ mkdir my-module
    $ cd my-module
    $ npm install @layeredapps/dashboard --no-save
    # create main.js to start the server
    # create index.js optionally exporting any relevant API
    # add your content
    $ npm publish

The "--no-save" flag is used to install Dashboard, this prevents your module from installing a redundant version of Dashboard when it is being installed by users.

When your module is published users can install it with NPM:

    $ npm install your_module_name

Modules must be activated in a web app's `package.json`:

    dashboard: {
        modules: [ "your_module_name" ]
    }

These paths have special significance:

| Folder                                    | Description                                      |
|-------------------------------------------|--------------------------------------------------|
| `/src/www`                                | Web server root                                  |
| `/src/www/public`                         | Static assets served quickly                     |
| `/src/www/account`                        | User account management pages                    |
| `/src/www/account/YOUR_MODULE/`           | Your additions (if applicable)                   |
| `/src/www/administrator`                  | Administration pages                             |
| `/src/www/administrator/YOUR_MODULE/`     | Your additions (if applicable)                   |
| `/src/www/api/user`                       | User account management pages                    |
| `/src/www/api/user/YOUR_MODULE/`          | Your additions (if applicable)                   |
| `/src/www/api/administrator`              | Administration APIs                              |
| `/src/www/api/administrator/YOUR_MODULE/` | Your additions (if applicable)                   |
| `/src/www/webhooks/YOUR_MODULE/`          | Endpoints for receiving webhooks (if applicable) |

Content pages may export `before`, `get` for rendering the page and `post` methods for submitting HTML forms.  API routes may export `before`, `get`, `post`, `patch`, `delete`, `put` methods.   If specified, the `before` method will execute before any `verb`.
 
Guest-accessible content and API routes can be flagged in the HTML or NodeJS:

    # HTML
    <html auth="false">

    # NodeJS API route
    { 
        auth: false,
        get: (req) = > {

        }
    }

Content can occupy the full screen without the template via a flag in the HTML or NodeJS:

    # HTML
    <html template="false">

    # NodeJS page handler
    { 
        template: false,
        get: (req, res) = > {

        }
    }

# Testing

Dashboard's test suite covers the `API` and the `UI`.  The `API` tests are performed by proxying a running instance of the software.  The `UI` tests are performed with `puppeteer` remotely-controlling `Chrome` to browse a running instance of the software and `Mocha` to execute the tests.  A `docker-compose.yml` is provided to create databases.


    $ npm run test-sqlite
    $ npm run test-sqlite-node-cache
    $ npm run test-sqlite-redis-cache
    $ npm run test-mysql
    $ npm run test-mysql-node-cache
    $ npm run test-mysql-redis-cache
    $ npm run test-mariadb
    $ npm run test-mariadb-node-cache
    $ npm run test-mariadb-redis-cache
    $ npm run test-postgresql
    $ npm run test-postgresql-node-cache
    $ npm run test-postgresql-redis-cache
    $ npm run test-mssql
    $ npm run test-mssql-node-cache
    $ npm run test-mssql-redis-cache
    $ npm run test-db2
    $ npm run test-db2-node-cache
    $ npm run test-db2-redis-cache

# Support and contributions

If you have encountered a problem post an issue on the appropriate [Github repository](https://github.com/layeredapps).  

If you would like to contribute check [Github Issues](https://github.com/layeredapps/dashboard) for ways you can help.

## Icons

Icons are obtained via [FlatIcon](https://flaticon.com) and copyright their respective owners:

- [Home button](https://www.flaticon.com/free-icon/home-button_60817) by [Google](https://www.flaticon.com/authors/google)
- [Account button](https://www.flaticon.com/free-icon/round-account-button-with-user-inside_61205) by [Google](https://www.flaticon.com/authors/google)
- [Administrator button](https://www.flaticon.com/free-icon/database_149749) by [Smashicons](https://www.flaticon.com/authors/smashicons)
- [Spillage menu](https://www.flaticon.com/free-icon/three-dots-more-indicator_60969) by [Google](https://www.flaticon.com/authors/google)

## License

This software is licensed under the MIT license, a copy is enclosed in the `LICENSE` file.  Included icon assets are licensed separately, refer to the `icons/licenses` folder for their licensing information.

Copyright (c) 2022 Ben Lowry

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.