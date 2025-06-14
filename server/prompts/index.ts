import { db } from '@everynews/database'
import { PromptDtoSchema, PromptSchema, prompt } from '@everynews/schema'
import { zValidator } from '@hono/zod-validator'
import { and, eq } from 'drizzle-orm'
import { Hono } from 'hono'
import { z } from 'zod'
import type { WithAuth } from '../bindings/auth'
import { authMiddleware } from '../middleware/auth'
import { apprentice } from '../subroutines/apprentice'

export const PromptsRouter = new Hono<WithAuth>()
  .use(authMiddleware)
  .get('/', async (c) => {
    const user = c.get('user')
    if (!user) return c.json({ error: 'Unauthorized' }, 401)

    const prompts = await db.query.prompt.findMany({
      orderBy: (prompt, { desc }) => [desc(prompt.updatedAt)],
      where: eq(prompt.userId, user.id),
    })

    return c.json(prompts.map((p) => PromptSchema.parse(p)))
  })
  .post('/', zValidator('json', PromptDtoSchema), async (c) => {
    const user = c.get('user')
    if (!user) return c.json({ error: 'Unauthorized' }, 401)
    const data = c.req.valid('json')

    const [newPrompt] = await db
      .insert(prompt)
      .values({
        ...data,
        userId: user.id,
      })
      .returning()

    return c.json(PromptSchema.parse(newPrompt))
  })
  .get('/:id', async (c) => {
    const user = c.get('user')
    if (!user) return c.json({ error: 'Unauthorized' }, 401)
    const id = c.req.param('id')

    const foundPrompt = await db.query.prompt.findFirst({
      where: and(eq(prompt.id, id), eq(prompt.userId, user.id)),
    })

    if (!foundPrompt) {
      return c.json({ error: 'Prompt not found' }, 404)
    }

    return c.json(PromptSchema.parse(foundPrompt))
  })
  .put('/:id', zValidator('json', PromptDtoSchema), async (c) => {
    const user = c.get('user')
    if (!user) return c.json({ error: 'Unauthorized' }, 401)
    const id = c.req.param('id')
    const data = c.req.valid('json')

    const [updatedPrompt] = await db
      .update(prompt)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(and(eq(prompt.id, id), eq(prompt.userId, user.id)))
      .returning()

    if (!updatedPrompt) {
      return c.json({ error: 'Prompt not found' }, 404)
    }

    return c.json(PromptSchema.parse(updatedPrompt))
  })
  .delete('/:id', async (c) => {
    const user = c.get('user')
    if (!user) return c.json({ error: 'Unauthorized' }, 401)
    const id = c.req.param('id')

    const [deletedPrompt] = await db
      .delete(prompt)
      .where(and(eq(prompt.id, id), eq(prompt.userId, user.id)))
      .returning()

    if (!deletedPrompt) {
      return c.json({ error: 'Prompt not found' }, 404)
    }

    return c.json({ success: true })
  })
  .post(
    '/test',
    zValidator(
      'json',
      z.object({
        promptContent: z.string(),
        url: z.string().url(),
      }),
    ),
    async (c) => {
      const user = c.get('user')
      if (!user) return c.json({ error: 'Unauthorized' }, 401)
      const { url, promptContent } = c.req.valid('json')

      try {
        const result = await apprentice({ promptContent, url })
        return c.json(result)
      } catch (error) {
        return c.json({ error: String(error) }, 500)
      }
    },
  )
