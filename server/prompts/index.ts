import { db } from '@everynews/database'
import { PromptDtoSchema, PromptSchema, prompt } from '@everynews/schema'
import { zValidator } from '@hono/zod-validator'
import { and, eq, isNull } from 'drizzle-orm'
import { Hono } from 'hono'
import type { WithAuth } from '@everynews/server/bindings/auth'
import { authMiddleware } from '@everynews/server/middleware/auth'

export const PromptsRouter = new Hono<WithAuth>()
  .use(authMiddleware)
  .get('/', async (c) => {
    const user = c.get('user')
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401)
    }

    const prompts = await db.query.prompt.findMany({
      orderBy: (prompt, { desc }) => [desc(prompt.updatedAt)],
      where: and(eq(prompt.userId, user.id), isNull(prompt.deletedAt)),
    })

    return c.json(prompts.map((p) => PromptSchema.parse(p)))
  })
  .post('/', zValidator('json', PromptDtoSchema), async (c) => {
    const user = c.get('user')
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401)
    }
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
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401)
    }
    const id = c.req.param('id')

    const foundPrompt = await db.query.prompt.findFirst({
      where: and(
        eq(prompt.id, id),
        eq(prompt.userId, user.id),
        isNull(prompt.deletedAt),
      ),
    })

    if (!foundPrompt) {
      return c.json({ error: 'Prompt not found' }, 404)
    }

    return c.json(PromptSchema.parse(foundPrompt))
  })
  .put('/:id', zValidator('json', PromptDtoSchema), async (c) => {
    const user = c.get('user')
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401)
    }

    const id = c.req.param('id')
    const data = c.req.valid('json')

    // Check if prompt exists and is not soft-deleted
    const existing = await db.query.prompt.findFirst({
      where: and(
        eq(prompt.id, id),
        eq(prompt.userId, user.id),
        isNull(prompt.deletedAt),
      ),
    })

    if (!existing) {
      return c.json({ error: 'Prompt not found' }, 404)
    }

    const [updatedPrompt] = await db
      .update(prompt)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(prompt.id, id),
          eq(prompt.userId, user.id),
          isNull(prompt.deletedAt),
        ),
      )
      .returning()

    if (!updatedPrompt) {
      return c.json({ error: 'Prompt not found' }, 404)
    }

    return c.json(PromptSchema.parse(updatedPrompt))
  })
  .delete('/:id', async (c) => {
    const user = c.get('user')
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401)
    }

    const id = c.req.param('id')

    // Soft delete by setting deletedAt
    const [deletedPrompt] = await db
      .update(prompt)
      .set({ deletedAt: new Date() })
      .where(
        and(
          eq(prompt.id, id),
          eq(prompt.userId, user.id),
          isNull(prompt.deletedAt),
        ),
      )
      .returning()

    if (!deletedPrompt) {
      return c.json({ error: 'Prompt not found' }, 404)
    }

    return c.json({ success: true })
  })
