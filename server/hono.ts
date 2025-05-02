import { auth } from "@everynews/auth";
import { Hono } from "hono";

const server = new Hono().basePath('/api')

server.get('/hello', (c) =>
  c.json({
    message: 'Hello from Hono on Vercel!',
  }),
)

server.on(["POST", "GET"], "/auth/*", (c) => {
	return auth.handler(c.req.raw);
});

export {server}
