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
      query TopDailyLaunches($date: Date!, $limit: Int!) {
        posts(
          order: VOTES
          postedAfter: $date
          postedBefore: $date
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
      date,
      limit,
    }

    const response = await fetch(PRODUCTHUNT_API_URL, {
      body: JSON.stringify({ query, variables }),
      headers: {
        Authorization: this.token,
        'Content-Type': 'application/json',
      },
      method: 'POST',
    })

    if (!response.ok) {
      throw new Error(
        `ProductHunt API error: ${response.status} ${response.statusText}`,
      )
    }

    const data = await response.json()
    const parsed = responseSchema.parse(data)

    return parsed.data.posts.edges.map((edge) => edge.node)
  }

  async getTodaysTopLaunches(limit: number = 10): Promise<ProductHuntPost[]> {
    const today = new Date().toISOString().split('T')[0]
    return this.getTopDailyLaunches(today, limit)
  }
}
