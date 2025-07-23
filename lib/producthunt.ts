import { z } from 'zod'

const PRODUCTHUNT_API_URL = 'https://api.producthunt.com/v2/api/graphql'

export const productHuntPostSchema = z.object({
  description: z.string().nullable(),
  id: z.string(),
  name: z.string(),
  tagline: z.string(),
  thumbnail: z
    .object({
      url: z.string().url(),
    })
    .nullable(),
  url: z.string().url(),
  votesCount: z.number(),
  website: z.string().url().nullable(),
})

export type ProductHuntPost = z.infer<typeof productHuntPostSchema>

const responseSchema = z.object({
  data: z.object({
    posts: z.object({
      edges: z.array(
        z.object({
          node: productHuntPostSchema,
        }),
      ),
    }),
  }),
})

export class ProductHuntClient {
  constructor(private token: string) {}

  async getTopDailyLaunches(
    date: string,
    limit: number = 10,
  ): Promise<ProductHuntPost[]> {
    const query = `
      query TopDailyLaunches($postedAfter: DateTime!, $postedBefore: DateTime!, $limit: Int!) {
        posts(
          order: VOTES
          postedAfter: $postedAfter
          postedBefore: $postedBefore
          first: $limit
        ) {
          edges {
            node {
              id
              name
              tagline
              description
              url
              website
              votesCount
              thumbnail { url }
            }
          }
        }
      }
    `

    // Convert date to DateTime format with start and end of day
    const startOfDay = `${date}T00:00:00Z`
    const endOfDay = `${date}T23:59:59Z`

    const variables = {
      limit,
      postedAfter: startOfDay,
      postedBefore: endOfDay,
    }

    const response = await fetch(PRODUCTHUNT_API_URL, {
      body: JSON.stringify({ query, variables }),
      headers: {
        Authorization: `Bearer ${this.token}`,
        'Content-Type': 'application/json',
      },
      method: 'POST',
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(
        `ProductHunt API error: ${response.status} ${response.statusText} - ${errorText}`,
      )
    }

    const data = await response.json()

    if (data.errors) {
      throw new Error(
        `ProductHunt GraphQL error: ${JSON.stringify(data.errors)}`,
      )
    }

    const parsed = responseSchema.parse(data)

    return parsed.data.posts.edges.map((edge) => edge.node)
  }

  async getTodaysTopLaunches(limit: number = 10): Promise<ProductHuntPost[]> {
    // Get posts from last 24 hours
    const now = new Date()
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000)

    const query = `
      query TopRecentLaunches($postedAfter: DateTime!, $limit: Int!) {
        posts(
          order: VOTES
          postedAfter: $postedAfter
          first: $limit
        ) {
          edges {
            node {
              id
              name
              tagline
              description
              url
              website
              votesCount
              thumbnail { url }
            }
          }
        }
      }
    `

    const variables = {
      limit,
      postedAfter: yesterday.toISOString(),
    }

    const response = await fetch(PRODUCTHUNT_API_URL, {
      body: JSON.stringify({ query, variables }),
      headers: {
        Authorization: `Bearer ${this.token}`,
        'Content-Type': 'application/json',
      },
      method: 'POST',
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(
        `ProductHunt API error: ${response.status} ${response.statusText} - ${errorText}`,
      )
    }

    const data = await response.json()

    if (data.errors) {
      throw new Error(
        `ProductHunt GraphQL error: ${JSON.stringify(data.errors)}`,
      )
    }

    const parsed = responseSchema.parse(data)

    return parsed.data.posts.edges.map((edge) => edge.node)
  }
}
