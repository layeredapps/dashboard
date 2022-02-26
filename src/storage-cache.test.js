/* eslint-env mocha */
const assert = require('assert')
const StorageCache = require('./storage-cache.js')

if (process.env.CACHE) {
  describe('internal-api/storage-cache', () => {
    describe('get', () => {
      it('should require key', async () => {
        let errorMessage
        try {
          await StorageCache.get()
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-key')
      })

      it('should return value', async () => {
        await StorageCache.set('test-read/1', 'value')
        const file = await StorageCache.get('test-read/1')
        assert.strictEqual(file, 'value')
      })
    })

    describe('set', () => {
      it('should require key', async () => {
        let errorMessage
        try {
          await StorageCache.set(null, 'value')
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-key')
      })

      it('should set value', async () => {
        await StorageCache.set('test-read/1', '{ "test": true }')
        const file = await StorageCache.get('test-read/1')
        assert.strictEqual(file, '{ "test": true }')
      })
    })

    describe('remove', () => {
      it('should require key', async () => {
        let errorMessage
        try {
          await StorageCache.set(null, 'value')
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-key')
      })

      it('should remove object', async () => {
        await StorageCache.set('test-read/1', '{ "test": true }')
        const file = await StorageCache.get('test-read/1')
        assert.strictEqual(file, '{ "test": true }')
        await StorageCache.remove('test-read/1')
        const fileNow = await StorageCache.get('test-read/1')
        assert.strictEqual(fileNow, undefined)
      })
    })
  })
}
