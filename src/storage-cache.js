let storageCache

module.exports = {
  setup: async () => {
    if (!process.env.CACHE) {
      storageCache = {
        get: async () => {},
        set: async () => {},
        remove: async () => {}
      }
    } else if (process.env.CACHE === 'node') {
      const cache = {}
      const cacheList = []
      storageCache = {
        get: async (key) => {
          const value = cache[key] ? '' + cache[key] : undefined
          return value
        },
        set: async (key, value) => {
          if (cache[key] === undefined) {
            cacheList.push(key)
          }
          cache[key] = value
          cacheList.unshift(key)
          if (cacheList.length > 100000) {
            const remove = cacheList.pop()
            delete (cache[remove])
          }
        },
        remove: async (key) => {
          delete cache[key]
        }
      }
    } else if (process.env.CACHE === 'redis') {
      const redisCache = require('./storage-cache-redis.js')
      storageCache = await redisCache()
    }
  },
  get: async (key) => {
    if (!storageCache) {
      return
    }
    if (!key || !key.length) {
      throw new Error('invalid-key')
    }
    const item = await storageCache.get(key)
    if (item) {
      const json = JSON.parse(item)
      for (const key in json) {
        if (json[key] && (key.endsWith('At') || key.endsWith('Since'))) {
          try {
            json[key] = new Date(json[key])
          } catch (error) {
          }
        }
      }
      return json
    }
  },
  set: async (key, value) => {
    if (!storageCache) {
      return
    }
    if (!key || !key.length) {
      throw new Error('invalid-key')
    }
    return storageCache.set(key, JSON.stringify(value))
  },
  remove: async (key) => {
    if (!storageCache) {
      return
    }
    if (!key || !key.length) {
      throw new Error('invalid-key')
    }
    return storageCache.remove(key)
  },
  close: () => {
    if (storageCache.close) {
      return storageCache.close()
    }
  }
}
