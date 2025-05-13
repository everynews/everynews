import { OpenAPIHono } from '@hono/zod-openapi'
import { getAllHandler } from './handlers'
import { getAll } from './routes'

export const newsRouter = new OpenAPIHono().openapi(getAll, getAllHandler)
