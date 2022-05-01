module.exports = async () => {
  const Redis = require('redis')
  const twentyFourHours = 24 * 60 * 60
  let client = Redis.createClient(process.env.STORAGE_CACHE_REDIS_URL || process.env.REDIS_URL || 'redis://127.0.0.1:6379')
  client.on('error', (error) => {
    throw error
  })
  client.on('end', () => {
    client = null
  })
  await client.connect()
  return {
    get: async (key) => {
      let result
      try {
        result = await client.get(key)
      } catch (error) {
      }
      if (!result) {
        return
      }
      try {
        const float = parseFloat(result, 10)
        if (float.toString() === result) {
          return float
        }
      } catch (error) {
      }
      try {
        const int = parseInt(result, 10)
        if (int.toString() === result) {
          return int
        }
      } catch (error) {
      }
      return result
    },
    set: async (key, value) => {
      try {
        await client.set(key, value)
        await client.expire(key, twentyFourHours)
      } catch (error) {
      }
    },
    remove: async (key) => {
      try {
        await client.del(key)
      } catch (error) {
      }
    },
    close: async () => {
      await client.quit()
    }
  }
}
