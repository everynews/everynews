import { afterAll, beforeAll, describe, expect, it } from 'bun:test'

describe('url', () => {
  let originalNodeEnv: string | undefined

  beforeAll(() => {
    originalNodeEnv = process.env.NODE_ENV
  })

  afterAll(() => {
    process.env.NODE_ENV = originalNodeEnv
  })

  describe('environment-based URL', () => {
    it('should return localhost URL in development', () => {
      process.env.NODE_ENV = 'development'
      // Need to re-import to get the new value
      delete require.cache[require.resolve('./url')]
      const { url: devUrl } = require('./url')

      expect(devUrl).toBe('http://localhost:3000')
    })

    it('should return production URL when not in development', () => {
      process.env.NODE_ENV = 'production'
      delete require.cache[require.resolve('./url')]
      const { url: prodUrl } = require('./url')

      expect(prodUrl).toBe('https://every.news')
    })

    it('should return production URL for test environment', () => {
      process.env.NODE_ENV = 'test'
      delete require.cache[require.resolve('./url')]
      const { url: testUrl } = require('./url')

      expect(testUrl).toBe('https://every.news')
    })

    it('should return production URL for staging environment', () => {
      process.env.NODE_ENV = 'staging'
      delete require.cache[require.resolve('./url')]
      const { url: stagingUrl } = require('./url')

      expect(stagingUrl).toBe('https://every.news')
    })

    it('should return production URL when NODE_ENV is undefined', () => {
      delete process.env.NODE_ENV
      delete require.cache[require.resolve('./url')]
      const { url: undefinedUrl } = require('./url')

      expect(undefinedUrl).toBe('https://every.news')
    })

    it('should return production URL when NODE_ENV is empty string', () => {
      process.env.NODE_ENV = ''
      delete require.cache[require.resolve('./url')]
      const { url: emptyUrl } = require('./url')

      expect(emptyUrl).toBe('https://every.news')
    })
  })

  describe('URL format validation', () => {
    it('should have valid URL format for development', () => {
      process.env.NODE_ENV = 'development'
      delete require.cache[require.resolve('./url')]
      const { url: devUrl } = require('./url')

      expect(() => new URL(devUrl)).not.toThrow()
      const parsedUrl = new URL(devUrl)
      expect(parsedUrl.protocol).toBe('http:')
      expect(parsedUrl.hostname).toBe('localhost')
      expect(parsedUrl.port).toBe('3000')
    })

    it('should have valid URL format for production', () => {
      process.env.NODE_ENV = 'production'
      delete require.cache[require.resolve('./url')]
      const { url: prodUrl } = require('./url')

      expect(() => new URL(prodUrl)).not.toThrow()
      const parsedUrl = new URL(prodUrl)
      expect(parsedUrl.protocol).toBe('https:')
      expect(parsedUrl.hostname).toBe('every.news')
      expect(parsedUrl.port).toBe('') // Default HTTPS port
    })
  })

  describe('edge cases', () => {
    it('should be case-sensitive for NODE_ENV', () => {
      process.env.NODE_ENV = 'DEVELOPMENT' // uppercase
      delete require.cache[require.resolve('./url')]
      const { url: upperUrl } = require('./url')

      expect(upperUrl).toBe('https://every.news') // Not development
    })

    it('should handle NODE_ENV with extra spaces', () => {
      process.env.NODE_ENV = ' development '
      delete require.cache[require.resolve('./url')]
      const { url: spacedUrl } = require('./url')

      expect(spacedUrl).toBe('https://every.news') // Not exactly 'development'
    })

    it('should be a string type', () => {
      process.env.NODE_ENV = 'development'
      delete require.cache[require.resolve('./url')]
      const { url: devUrl } = require('./url')

      expect(typeof devUrl).toBe('string')
    })

    it('should not contain trailing slashes', () => {
      process.env.NODE_ENV = 'development'
      delete require.cache[require.resolve('./url')]
      const { url: devUrl } = require('./url')

      expect(devUrl).not.toMatch(/\/$/)

      process.env.NODE_ENV = 'production'
      delete require.cache[require.resolve('./url')]
      const { url: prodUrl } = require('./url')

      expect(prodUrl).not.toMatch(/\/$/)
    })
  })

  describe('module caching behavior', () => {
    it('should export the same value on multiple imports without cache clear', () => {
      process.env.NODE_ENV = 'development'
      delete require.cache[require.resolve('./url')]
      const { url: url1 } = require('./url')

      // Change NODE_ENV but don't clear cache
      process.env.NODE_ENV = 'production'
      const { url: url2 } = require('./url')

      // Should still be development URL due to module caching
      expect(url1).toBe(url2)
      expect(url1).toBe('http://localhost:3000')
    })
  })
})
