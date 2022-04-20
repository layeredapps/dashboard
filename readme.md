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
- [Configuring Dashboard](#configuring-dashboard)
- [Dashboard modules](#dashboard-modules)
- [Customize registration information](#customize-registration-information)
- [Adding links to the header menus](#adding-links-to-the-header-menus)
- [Access the API from your application server](#access-the-api)
- [Localization](#localization)
- [Storage backends](#storage-backends)
- [Storage caching](#storage-caching)
- [Logging](#logging)
- [Creating modules for Dashboard](#creating-modules-for-dashboard)
- [Testing](#testing)
- [Github repository](https://github.com/layeredapps/dashboard)
- [NPM package](https://npmjs.org/layeredapps/dashboard)

# Introduction

Web applications often require coding a user account system, organizations, subscriptions and other 'boilerplate' again and again.  

Dashboard packages everything web apps need into reusable, modular software.  It runs separately to your application so you have two web servers instead of one, and Dashboard fuses their content together to provide a single website or interface for your users.  To get started your web app just needs to serve something on `/` for your guest home page and `/home` for signed in users.

Dashboard is stateless and designed to scale 'horizontally', that is you can run multiple instances of your Dashboard server in parallel to handle user requests using Heroku, Kubernetes, etc.  Managed hosting is avilable at [Layered Apps](https://layeredapps.com).

Dashboard uses a `template.html` with header, navigation and content structure.  Dashboard and module content is provided in HTML pages.  Your application server can serve two special CSS files at `/public/template-additional.css` and `/public/content-additional.css` to theme the template and pages to match your application design.

Your application server can return special HTML attributes and tags to interoperate with the Dashboard server.  Your content can be accessible to guests by specifying `<html data-auth="false">` and you can serve full-page content by specifying `<html data-template="false">` in your HTML.  Otherwise the routes will require authentication, and Dashboard will inject the template's header and navigation int the top of the page and merge the head tag's script and CSS references.

You can populate the template's navigation bar by including `<template id="navbar"></template>` with the links and any other HTML for your menu.

# Hosting Dashboard yourself

Dashboard requires NodeJS `16+` be installed.

    $ mkdir my-dashboard-server
    $ cd my-dashboard-server
    $ npm init
    $ npm install @layeredapps/dashboard
    $ echo "require('@layeredapps/dashboard').start(__dirname)" > main.js
    $ node main.js

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
    

The "themeColor" and "tileColor" will replace the META tag values in template and template-less pages of Dashboard, allowing you to style your favicon and other icons.  Dashboard will check your application server for replacement icons:

    /public/favicon.ico
    /public/favicon-16x16.png
    /public/favicon-32x32.png
    /public/apple-touch-icon.png

For additional icons you can specify <>

# Dashboard modules

Dashboard is modular and by itself it provides only the signing in, account management and basic administration.  Modules add new pages and API routes for additional functionality.

| Name                                                                                                | Description                               |
|-----------------------------------------------------------------------------------------------------|-------------------------------------------|
| [@layeredapps/maxmind-geoip](https://npmjs.com/package/layeredapps/maxmind-geoip)               | IP address-based geolocation by MaxMind   |
| [@layeredapps/organizations](https://npmjs.com/package/layeredapps/organizations)               | User created groups                       |
| [@layeredapps/stripe-connect](https://npmjs.com/package/layeredapps/stripe-connect)             | Marketplace functionality by Stripe       |
| [@layeredapps/stripe-subscriptions](https://npmjs.com/package/layeredapps/stripe-subscriptions) | SaaS functionality by Stripe              |

Modules are NodeJS packages that you install with NPM:

    $ npm install @layeredapps/stripe-subscriptions

You need to notify Dashboard which modules you are using in `package.json` conffiguration:

    "dashboard": {
      "modules": [
        "@layeredapps/stripe-subscriptions"
      ]
    }

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

# Adding links to the header menus

The account and administrator drop-down menus are created from stub HTML files placed in Dashboard, modules, and your project.  To add your own links create a `/menu-account.html` and `/menu-administrator.html` in your project with the HTML to include.

The account menu is compiled in this order:

1) Your project's `/menu-account.html`
2) Any activated module's `/menu-account.html` files
3) Dashboard's `/menu-account.html`

The administrator menu is compiled in this order:

1) Your project's `/menu-administrator.html`
2) Any activated module's `/menu-administrator.html` files
3) Dashboard's `/menu-administrator.html`

# Access the API

Dashboard and official modules are completely API-driven and you can access the same APIs on behalf of the user making requests.  You perform `GET`, `POST`, `PATCH`, and `DELETE` HTTP requests against the API endpoints to fetch or modify data.  You can use a shared secret `APPLICATION_SERVER_TOKEN` to verify requests between servers, both servers send it in an `x-application-server-token` header. 

By default the API is not accessible, you can allow total access to it with an `ENV` variable:

    ALLOW_PUBLIC_API=true

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

Dashboard uses the [Sequelize](github.com/sequelize/) library and is compatible with PostgreSQL, MySQL, MariaDB and SQLite.  Support for Microsoft SQL Server and IBM DB2 is possible but [has issues]().

| Storage     | Environment variables                          |
|-------------|------------------------------------------------|
| SQLITE      | STORAGE=sqlite                                 |
|             | SQLITE_DATABASE=dashboard                      |
|             | SQLITE_DATABASE_FILE=/path/file.sqlite         |
| POSTGRESQL  | STORAGE=postgresql                             |
|             | POSTGRESQL_DATABASE_URL=postgres://...         |
| MariaDB     | STORAGE=mariadb                                |
|             | MARIADB_HOST=                                  |
|             | MARIADB_DATABASE=                              |
|             | MARIADB_USERNAME=                              |
|             | MARIADB_PASSWORD=                              |
|             | MARIADB_PORT=                                  |
| MYSQL       | STORAGE=mysql                                  |
|             | MYSQL_HOST=                                    |
|             | MYSQL_DATABASE=                                |
|             | MYSQL_USERNAME=                                |
|             | MYSQL_PASSWORD=                                |
|             | MYSQL_PORT=                                    |
| MSSQL       | STORAGE=mssql                                  |
|             | MSSQL_HOST=                                    |
|             | MSSQL_DATABASE=                                |
|             | MSSQL_USERNAME=                                |
|             | MSSQL_PASSWORD=                                |
|             | MSSQL_PORT=                                    |
| DB2         | STORAGE=db2                                    |
|             | DB2_HOST=                                      |
|             | DB2_DATABASE=                                  |
|             | DB2_USERNAME=                                  |
|             | DB2_PASSWORD=                                  |
|             | DB2_PORT=                                      |

Dashboard modules are able to use their own storage settings:

    $ SUBSCRIPTIONS_STORAGE=postgresql \
      SUBSCRIPTIONS_DATABASE_URL=postgres://localhost:5432/subscriptions \
      ORGANIZATIONS_STORAGE=mysql \
      ORGANIZATIONS_MYSQL_DATABASE=dbname \
      ORGANIZATIONS_MYSQL_HOST=localhost \
      ORGANIZATIONS_MYSQL_PORT=3306 \
      ORGANIZATIONS_MYSQL_PASSWORD=xxxxx \
      ORGANIZATIONS_MYSQL_USERNAME=yyyyy \
      CONNECT_STORAGE=sqlite \
      CONNECT_SQLITE_DATABASE_FILE=/my/database.sqlite \
      node main.js


# Storage caching

You can complement your storage backend with optional caching, either using RAM if you have a single instance of your Dashboard server, or Redis if you need a cache shared by multiple instances of your Dashboard server.


You can optionally use Redis as a cache, this is good for any storage on slow disks.

    $ CACHE=redis \
      CACHE_REDIS_URL=redis:/.... \
      node main.js

If you have a single Dashboard server you can cache within memory:

    $ CACHE=node \
      node main.js

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

## License

This software is licensed under the MIT license, a copy is enclosed in the `LICENSE` file.  Included icon assets are licensed separately, refer to the `icons/licenses` folder for their licensing information.

Copyright (c) 2022 Ben Lowry

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.