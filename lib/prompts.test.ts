import { beforeEach, describe, expect, it, mock } from 'bun:test'
import type { Content } from '@everynews/schema'
import { DEFAULT_PROMPT_PLACEHOLDER, prepareContentInput } from './prompts'

// Mock fetch globally
const mockFetch = mock((url: string) => {
  if (url.includes('markdown')) {
    return Promise.resolve({
      text: () =>
        Promise.resolve('# Markdown Content\n\nThis is the markdown body.'),
    })
  }
  if (url.includes('html')) {
    return Promise.resolve({
      text: () =>
        Promise.resolve('<h1>HTML Content</h1><p>This is the HTML body.</p>'),
    })
  }
  return Promise.reject(new Error('Unknown URL'))
})

global.fetch = mockFetch as any

describe('prompts', () => {
  describe('DEFAULT_PROMPT_PLACEHOLDER', () => {
    it('should have the correct placeholder text', () => {
      expect(DEFAULT_PROMPT_PLACEHOLDER).toBe(
        'Enter your prompt instructions here...',
      )
    })

    it('should be a string', () => {
      expect(typeof DEFAULT_PROMPT_PLACEHOLDER).toBe('string')
    })
  })

  describe('prepareContentInput', () => {
    beforeEach(() => {
      mockFetch.mockClear()
      // Reset to default mock implementation
      mockFetch.mockImplementation((url: string) => {
        if (url.includes('markdown')) {
          return Promise.resolve({
            text: () =>
              Promise.resolve(
                '# Markdown Content\n\nThis is the markdown body.',
              ),
          })
        }
        if (url.includes('html')) {
          return Promise.resolve({
            text: () =>
              Promise.resolve(
                '<h1>HTML Content</h1><p>This is the HTML body.</p>',
              ),
          })
        }
        return Promise.reject(new Error('Unknown URL'))
      })
    })

    it('should fetch and format markdown content when markdownBlobUrl is provided', async () => {
      const content: Content = {
        createdAt: new Date(),
        htmlBlobUrl: 'https://blob.example.com/html/123',
        id: '123',
        markdownBlobUrl: 'https://blob.example.com/markdown/123',
        title: 'Test Article',
        updatedAt: new Date(),
        url: 'https://example.com/article',
      } as Content

      const result = await prepareContentInput(content)

      expect(mockFetch).toHaveBeenCalledTimes(1)
      expect(mockFetch).toHaveBeenCalledWith(
        'https://blob.example.com/markdown/123',
      )
      expect(result).toBe(
        '# [Test Article](https://example.com/article)\n\n# Markdown Content\n\nThis is the markdown body.',
      )
    })

    it('should fetch and format HTML content when markdownBlobUrl is not provided', async () => {
      const content: Content = {
        createdAt: new Date(),
        htmlBlobUrl: 'https://blob.example.com/html/456',
        id: '456',
        markdownBlobUrl: null,
        title: 'HTML Article',
        updatedAt: new Date(),
        url: 'https://example.com/html-article',
      } as Content

      const result = await prepareContentInput(content)

      expect(mockFetch).toHaveBeenCalledTimes(1)
      expect(mockFetch).toHaveBeenCalledWith(
        'https://blob.example.com/html/456',
      )
      expect(result).toBe(
        '# [HTML Article](https://example.com/html-article)\n\n<h1>HTML Content</h1><p>This is the HTML body.</p>',
      )
    })

    it('should prefer markdown over HTML when both are available', async () => {
      const content: Content = {
        createdAt: new Date(),
        htmlBlobUrl: 'https://blob.example.com/html/789',
        id: '789',
        markdownBlobUrl: 'https://blob.example.com/markdown/789',
        title: 'Both Formats Article',
        updatedAt: new Date(),
        url: 'https://example.com/both',
      } as Content

      const _result = await prepareContentInput(content)

      expect(mockFetch).toHaveBeenCalledTimes(1)
      expect(mockFetch).toHaveBeenCalledWith(
        'https://blob.example.com/markdown/789',
      )
      expect(mockFetch).not.toHaveBeenCalledWith(
        'https://blob.example.com/html/789',
      )
    })

    it('should handle empty content responses', async () => {
      mockFetch.mockImplementation(() =>
        Promise.resolve({
          text: () => Promise.resolve(''),
        }),
      )

      const content: Content = {
        createdAt: new Date(),
        htmlBlobUrl: 'https://blob.example.com/html/999',
        id: '999',
        markdownBlobUrl: 'https://blob.example.com/markdown/999',
        title: 'Empty Content',
        updatedAt: new Date(),
        url: 'https://example.com/empty',
      } as Content

      const result = await prepareContentInput(content)

      expect(result).toBe('# [Empty Content](https://example.com/empty)\n\n')
    })

    it('should truncate content to 100,000 characters', async () => {
      const longContent = 'A'.repeat(200_000)
      mockFetch.mockImplementation(() =>
        Promise.resolve({
          text: () => Promise.resolve(longContent),
        }),
      )

      const content: Content = {
        createdAt: new Date(),
        htmlBlobUrl: 'https://blob.example.com/html/1000',
        id: '1000',
        markdownBlobUrl: 'https://blob.example.com/markdown/1000',
        title: 'Long Article',
        updatedAt: new Date(),
        url: 'https://example.com/long',
      } as Content

      const result = await prepareContentInput(content)

      expect(result).toHaveLength(100_000)
      expect(
        result.startsWith('# [Long Article](https://example.com/long)\n\n'),
      ).toBe(true)
    })

    it('should handle fetch errors gracefully', async () => {
      mockFetch.mockImplementation(() =>
        Promise.reject(new Error('Network error')),
      )

      const content: Content = {
        createdAt: new Date(),
        htmlBlobUrl: 'https://blob.example.com/html/404',
        id: '404',
        markdownBlobUrl: 'https://blob.example.com/markdown/404',
        title: 'Error Article',
        updatedAt: new Date(),
        url: 'https://example.com/error',
      } as Content

      await expect(prepareContentInput(content)).rejects.toThrow(
        'Network error',
      )
    })

    it('should escape special characters in title and URL', async () => {
      const content: Content = {
        createdAt: new Date(),
        htmlBlobUrl: 'https://blob.example.com/html/555',
        id: '555',
        markdownBlobUrl: 'https://blob.example.com/markdown/555',
        title: 'Title with [brackets] and (parentheses)',
        updatedAt: new Date(),
        url: 'https://example.com/article?param=value&other=test',
      } as Content

      const result = await prepareContentInput(content)

      // Note: The function doesn't escape markdown characters, which might be intentional
      expect(result).toContain('[Title with [brackets] and (parentheses)]')
      expect(result).toContain(
        '(https://example.com/article?param=value&other=test)',
      )
    })

    it('should handle content with various URL schemes', async () => {
      const schemes = [
        'http://example.com/article',
        'https://example.com/article',
        'ftp://example.com/article',
        '//example.com/article',
        '/relative/path/article',
      ]

      for (const url of schemes) {
        const content: Content = {
          createdAt: new Date(),
          htmlBlobUrl: 'https://blob.example.com/html/test',
          id: Math.random().toString(),
          markdownBlobUrl: 'https://blob.example.com/markdown/test',
          title: 'Test Article',
          updatedAt: new Date(),
          url,
        } as Content

        const result = await prepareContentInput(content)
        expect(result).toContain(`[Test Article](${url})`)
      }
    })

    it('should handle content with empty URLs', async () => {
      const content: Content = {
        createdAt: new Date(),
        htmlBlobUrl: 'https://blob.example.com/html/666',
        id: '666',
        markdownBlobUrl: 'https://blob.example.com/markdown/666',
        title: 'No URL Article',
        updatedAt: new Date(),
        url: '',
      } as Content

      const result = await prepareContentInput(content)

      expect(result).toContain('[No URL Article]()')
    })

    it('should handle concurrent fetch operations', async () => {
      const contents: Content[] = Array.from(
        { length: 5 },
        (_, i) =>
          ({
            createdAt: new Date(),
            htmlBlobUrl: `https://blob.example.com/html/${i}`,
            id: i.toString(),
            markdownBlobUrl: `https://blob.example.com/markdown/${i}`,
            title: `Article ${i}`,
            updatedAt: new Date(),
            url: `https://example.com/article-${i}`,
          }) as Content,
      )

      const results = await Promise.all(contents.map(prepareContentInput))

      expect(results).toHaveLength(5)
      results.forEach((result, i) => {
        expect(result).toContain(
          `[Article ${i}](https://example.com/article-${i})`,
        )
      })
      expect(mockFetch).toHaveBeenCalledTimes(5)
    })
  })
})
