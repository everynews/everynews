import { nanoid } from '@everynews/lib/id'
import {
  boolean,
  integer,
  json,
  numeric,
  pgTable,
  text,
  timestamp,
} from 'drizzle-orm/pg-core'

export const users = pgTable('users', {
  id: text('id').primaryKey().$defaultFn(nanoid),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: boolean('email_verified').notNull(),
  image: text('image'),
  createdAt: timestamp('created_at').notNull(),
  updatedAt: timestamp('updated_at').notNull(),
  role: text('role'),
  banned: boolean('banned'),
  banReason: text('ban_reason'),
  banExpires: timestamp('ban_expires'),
})

export const sessions = pgTable('sessions', {
  id: text('id').primaryKey().$defaultFn(nanoid),
  expiresAt: timestamp('expires_at').notNull(),
  token: text('token').notNull().unique(),
  createdAt: timestamp('created_at').notNull(),
  updatedAt: timestamp('updated_at').notNull(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  impersonatedBy: text('impersonated_by'),
  activeOrganizationId: text('active_organization_id'),
})

export const accounts = pgTable('accounts', {
  id: text('id').primaryKey().$defaultFn(nanoid),
  accountId: text('account_id').notNull(),
  providerId: text('provider_id').notNull(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  idToken: text('id_token'),
  accessTokenExpiresAt: timestamp('access_token_expires_at'),
  refreshTokenExpiresAt: timestamp('refresh_token_expires_at'),
  scope: text('scope'),
  password: text('password'),
  createdAt: timestamp('created_at').notNull(),
  updatedAt: timestamp('updated_at').notNull(),
})

export const verifications = pgTable('verifications', {
  id: text('id').primaryKey().$defaultFn(nanoid),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at'),
  updatedAt: timestamp('updated_at'),
})

export const apikeys = pgTable('apikeys', {
  id: text('id').primaryKey().$defaultFn(nanoid),
  name: text('name').notNull(),
  start: text('start'),
  prefix: text('prefix'),
  key: text('key').notNull(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  refillInterval: integer('refill_interval'),
  refillAmount: integer('refill_amount'),
  lastRefillAt: timestamp('last_refill_at'),
  enabled: boolean('enabled'),
  rateLimitEnabled: boolean('rate_limit_enabled'),
  rateLimitTimeWindow: integer('rate_limit_time_window'),
  rateLimitMax: integer('rate_limit_max'),
  requestCount: integer('request_count'),
  remaining: integer('remaining'),
  lastRequest: timestamp('last_request'),
  expiresAt: timestamp('expires_at'),
  createdAt: timestamp('created_at').notNull(),
  updatedAt: timestamp('updated_at').notNull(),
  permissions: text('permissions'),
  metadata: text('metadata'),
})

export const organizations = pgTable('organizations', {
  id: text('id').primaryKey().$defaultFn(nanoid),
  name: text('name').notNull(),
  slug: text('slug').unique(),
  logo: text('logo'),
  createdAt: timestamp('created_at').notNull(),
  metadata: text('metadata'),
})

export const members = pgTable('members', {
  id: text('id').primaryKey().$defaultFn(nanoid),
  organizationId: text('organization_id')
    .notNull()
    .references(() => organizations.id, { onDelete: 'cascade' }),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  role: text('role').notNull(),
  createdAt: timestamp('created_at').notNull(),
})

export const invitations = pgTable('invitations', {
  id: text('id').primaryKey().$defaultFn(nanoid),
  organizationId: text('organization_id')
    .notNull()
    .references(() => organizations.id, { onDelete: 'cascade' }),
  email: text('email').notNull(),
  role: text('role'),
  status: text('status').notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  inviterId: text('inviter_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
})

export const passkeys = pgTable('passkeys', {
  id: text('id').primaryKey().$defaultFn(nanoid),
  name: text('name'),
  publicKey: text('public_key').notNull(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  credentialID: text('credential_i_d').notNull(),
  counter: integer('counter').notNull(),
  deviceType: text('device_type').notNull(),
  backedUp: boolean('backed_up').notNull(),
  transports: text('transports'),
  createdAt: timestamp('created_at'),
})

export const news = pgTable('news', {
  id: text('id').primaryKey().$defaultFn(nanoid),
  organizationId: text('organization_id')
    .notNull()
    .references(() => organizations.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  searchQuery: json('search_query').notNull(), // SERP API configuration
  relevanceSettings: json('relevance_settings').notNull(), // Scoring rules
  waitSettings: json('wait_settings').notNull(), // Batch/digest settings
  isActive: boolean('is_active').notNull().default(true),
  lastRun: timestamp('last_run'), // Last search execution
  lastSent: timestamp('last_sent'), // Last batch sent
  nextRun: timestamp('next_run'), // Next scheduled execution
  createdAt: timestamp('created_at').notNull(),
  updatedAt: timestamp('updated_at').notNull(),
})

export const schedules = pgTable('schedules', {
  id: text('id').primaryKey().$defaultFn(nanoid),
  newsId: text('news_id')
    .notNull()
    .references(() => news.id, { onDelete: 'cascade' }),
  cronExpr: text('cron_expr').notNull(),
  isActive: boolean('is_active').notNull().default(true),
  lastSuccess: timestamp('last_success'),
  lastFailure: timestamp('last_failure'),
  errorDetails: json('error_details'),
  createdAt: timestamp('created_at').notNull(),
  updatedAt: timestamp('updated_at').notNull(),
})

export const stories = pgTable('stories', {
  id: text('id').primaryKey().$defaultFn(nanoid),
  newsId: text('news_id')
    .notNull()
    .references(() => news.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  url: text('url').notNull().unique(), // For deduplication
  snippet: text('snippet'),
  relevanceScore: numeric('relevance_score').notNull(),
  wasDelivered: boolean('was_delivered').notNull().default(false), // Queued for delivery
  foundAt: timestamp('found_at').notNull(),
  createdAt: timestamp('created_at').notNull(),
})

export const channels = pgTable('channels', {
  id: text('id').primaryKey().$defaultFn(nanoid),
  organizationId: text('organization_id')
    .notNull()
    .references(() => organizations.id, { onDelete: 'cascade' }),
  type: text('type').notNull(), // email, slack, etc
  config: json('config').notNull(), // Channel-specific configuration
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').notNull(),
  updatedAt: timestamp('updated_at').notNull(),
})
