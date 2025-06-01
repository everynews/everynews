import { db } from '@everynews/drizzle'
import { type ContentDto, type StoryDto, stories } from '@everynews/schema'
import OpenAI from 'openai'
import { z } from 'zod'

export interface StoryJob {
  contentId: string
  newsId: string
  content: ContentDto
}

export const StoryProcessingSchema = z.object({
  relevanceScore: z.number().min(0).max(10), // Concise story title
  snippet: z.string().max(500), // Story snippet/summary
  tags: z.array(z.string()).max(10), // 0-10 relevance rating
  title: z.string().max(200), // Topic tags for context
})

export type StoryProcessing = z.infer<typeof StoryProcessingSchema>

export class SageService {
  private static instance: SageService
  private openai: OpenAI

  // Queue functionality
  private readonly pending: StoryJob[] = []
  private running = 0
  private readonly concurrency = 2 // Lower concurrency for LLM calls
  private lastProcessTime = 0
  private readonly rateLimit = 10000 // 10 seconds between operations

  private constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })
  }

  public static get(): SageService {
    if (!SageService.instance) {
      SageService.instance = new SageService()
    }
    return SageService.instance
  }

  /** Add content to the story creation queue */
  async enqueue(
    contentId: string,
    newsId: string,
    content: ContentDto,
  ): Promise<void> {
    this.pending.push({ content, contentId, newsId })
    this.schedule()
  }

  /** Try to keep the story creation pipeline full */
  private schedule(): void {
    if (this.running < this.concurrency && this.pending.length) {
      const now = Date.now()
      const timeSinceLastProcess = now - this.lastProcessTime

      if (timeSinceLastProcess >= this.rateLimit) {
        const job = this.pending.shift() as StoryJob
        this.running++
        this.lastProcessTime = now
        void this.processJob(job)
      } else {
        // Schedule next check after rate limit expires
        const delay = this.rateLimit - timeSinceLastProcess
        setTimeout(() => this.schedule(), delay)
      }
    }
  }

  /** Process a story creation job with error handling */
  private async processJob(job: StoryJob): Promise<void> {
    try {
      const storyData = await this.processContent(job.content)

      // Create story in database
      const storyDto: StoryDto = {
        snippet: storyData.snippet,
        title: storyData.title,
        url: job.content.url,
      }

      await db
        .insert(stories)
        .values({
          contentId: job.contentId,
          newsId: job.newsId,
          snippet: storyDto.snippet,
          title: storyDto.title,
          url: storyDto.url,
        })
        .execute()

      console.log(`Created story ${job.contentId}: ${storyData.title}`)
    } catch (err) {
      console.error('SageService job failed', err)
    } finally {
      this.running--
      // Schedule next job after rate limit delay
      setTimeout(() => this.schedule(), this.rateLimit)
    }
  }

  /** Process content into story format using OpenAI */
  async processContent(content: ContentDto): Promise<StoryProcessing> {
    const prompt = this.buildPrompt(content)

    const completion = await this.openai.chat.completions.create({
      max_tokens: 800, // Cost-effective model for story processing
      messages: [
        {
          content:
            'You are a professional news editor. Process the given article into a news story format with an engaging title and concise snippet. Focus on newsworthiness and reader engagement.',
          role: 'system',
        },
        {
          content: prompt,
          role: 'user',
        },
      ],
      model: 'gpt-4o-mini',
      response_format: { type: 'json_object' }, // Slightly higher for more engaging titles
      temperature: 0.4,
    })

    const responseText = completion.choices[0]?.message?.content
    if (!responseText) {
      throw new Error('No response from OpenAI')
    }

    try {
      const parsed = JSON.parse(responseText)
      return StoryProcessingSchema.parse(parsed)
    } catch (_error) {
      console.error('Failed to parse OpenAI response:', responseText)
      throw new Error('Invalid story format from OpenAI')
    }
  }

  /** Build prompt for OpenAI with content details */
  private buildPrompt(content: ContentDto): string {
    return `Process this article into a news story format and provide a JSON response with the following structure:
{
  "title": "Engaging, newsworthy title (max 200 chars)",
  "snippet": "Compelling summary that highlights the key story (max 500 chars)", 
  "relevanceScore": 8 (rate 0-10 how newsworthy/important this is),
  "tags": ["tag1", "tag2", ...] (max 10 relevant topic tags)
}

Article Details:
- URL: ${content.url}
- Title: ${content.title || 'No title'}
- Description: ${content.description || 'No description'}
- OG Title: ${content.ogTitle || 'N/A'}
- OG Description: ${content.ogDescription || 'N/A'}
- Site: ${content.ogSiteName || 'Unknown'}

Guidelines:
- Create a title that's more engaging than the original if needed
- Write a snippet that captures the essence and importance of the story
- Rate relevance based on newsworthiness, impact, and timeliness
- Use tags that help categorize and discover the story

Focus on transforming raw content into a polished news story that readers will find valuable and engaging.`
  }

  /** Process a batch of content items */
  async run(
    contentItems: Array<{
      contentId: string
      newsId: string
      content: ContentDto
    }>,
  ): Promise<StoryProcessing[]> {
    return Promise.all(
      contentItems.map((item) => this.processContent(item.content)),
    )
  }
}
