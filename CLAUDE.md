# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Core Development
- `bun run dev` - Start development environment (Next.js frontend + Drizzle Studio + React Email)
- `bun run build` - Build for production
- `bun run next:dev` - Start Next.js dev server only (with Turbopack)
- `bun run next:start` - Start production Next.js server

### Code Quality & Formatting
- `bun run style:check` - Format code with Biome and fix issues
- `bun run tidy` - Run all checks (format, schema validation, build)

### Database Management
- `bun run db:studio` - Open Drizzle Studio for database management
- `bun run db:generate` - Generate database migrations
- `bun run db:migrate` - Apply database migrations
- `bun run db:push` - Push schema changes to database
- `bun run db:check` - Validate database schema

### Email Development
- `bun run email:dev` - Start React Email dev server on port 5678

### Authentication
- `bun run auth:update` - Update Better Auth schema and format code

## Architecture Overview

### Tech Stack
- **Frontend**: Next.js 15 (App Router) with React 19, Tailwind CSS 4
- **Backend**: Hono Stacks (Hono RPC) API with OpenAPI documentation
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Better Auth with magic link support
- **Email**: React Email with Plunk
- **Deployment**: Vercel (with Analytics and Speed Insights)
- **Code Quality**: Biome for formatting/linting, Lefthook for git hooks

### Project Structure
- `/app` - Next.js App Router pages and layouts
- `/server` - Hono.js API routes and middleware
- `/schema` - Drizzle database schemas
- `/auth` - Better Auth configuration
- `/components` - React components with shadcn/ui
- `/emails` - React Email templates
- `/drizzle` - Database migrations

### API Architecture
The app uses Hono.js for the backend API with:
- OpenAPI documentation auto-generated and served at `/api`
- Type-safe routes with Zod validation
- Authentication middleware on all routes
- Modular routers for alerts, channels, subscriptions, and worker processes

### Database Schema
Key entities include:
- Users and authentication (Better Auth tables)
- Alerts and subscriptions
- Content and stories
- Channels for delivery
- Worker status tracking

### Background Processing
The app includes subroutines for:
- Content curation (curator, curators/)
- Content scraping (reaper, reapers/)
- Content processing (sage)
- Content delivery (herald)

## Data Flow Architecture

The application follows a hybrid approach for data handling:

### Server-Side Data Display (Server Components)
- All user data presentation uses direct database access through Drizzle ORM
- Server Components render data at request time for optimal performance and SEO
- Examples: Alert lists (`app/alerts/(index)/page.tsx`), alert details (`app/alerts/[id]/page.tsx`)
- Authentication state checked server-side with `whoami()` function
- Data fetched directly: `db.select().from(alert).where(eq(alert.userId, user.id))`

### Client-Side Data Mutations (Hono RPC)
- All form submissions and user actions use Hono RPC client for type-safe API calls
- Client Components handle interactive forms and user actions
- Examples: Alert creation/editing (`components/alert-detail.tsx`), deletion (`components/delete-alert-popover.tsx`)
- API client configured: `api.alerts.$post({ json: data })` or `api.alerts[':id'].$delete({ param: { id } })`
- Uses `router.refresh()` to trigger server-side re-rendering after mutations

### Pattern Benefits
- **Performance**: Server Components eliminate client-side data fetching waterfalls
- **Type Safety**: Hono RPC provides end-to-end type safety for mutations
- **SEO**: Server-rendered content is fully indexable
- **UX**: Client-side mutations provide immediate feedback with loading states
- **Consistency**: Server refresh ensures UI stays in sync with database state

### Implementation Details
- Hono client configured in `app/api/index.ts` with credentials and base URL
- Client Components marked with `'use client'` directive
- Form handling uses React Hook Form with Zod validation matching server schemas

## Notes

- Prefer Shadcn Primitives, such as bg-background instead of defining two different colors for light mode and dark mode.
- Prefer Tailwind gap instead of paddings and margins. Do not use space-x or space-y; use gap. Or, do not use mb- and use gap- in the parent element.
- Always prefer to use Server Component Rendering, and in the smallest component scope possible.
- Within small components, prefer gap-1 instead of gap-2.
- Do not use arbitrary tailwind styles, such as min-h-[blah-blah]. Use the closest tailwind default, such as min-h-96.
- For submitting Hono RPC actions, try to use <SubmitButton /> Component.
- Do not use arrow directly as unicode. Use Lucide icons such as <ArrowLeft />.
- Inside a button, do not use an icon. Only put plain text in it.
- Prefer Tailwind shorthand notations, such as `size-`.

## API Router Conventions

- Use singular form for router names (e.g., `UserRouter`, `AlertRouter`, `ChannelRouter`) instead of plural forms
- Keep route paths plural (e.g., `/users`, `/alerts`, `/channels`) even though router names are singular
- Prefer `zValidator` from `@hono/zod-validator` over `validator` from `hono-openapi/zod` for request validation
- Use `zValidator('json', schema)` for body validation and `zValidator('param', schema)` for parameter validation

## User Settings Architecture

- User settings live at `/settings` (not under `/my/settings`) with its own layout and sidebar
- Settings page fetches full user data from database since session user object has limited fields
- Settings link should be accessible from the user profile dropdown in the main navigation
- Use toast notifications from `sonner` package (not custom hooks) for user feedback