import { z } from 'zod'
import 'zod-openapi/extend'
import { nanoid } from '@everynews/lib/id'
import { relations } from 'drizzle-orm'
import { pgTable, text, timestamp } from 'drizzle-orm/pg-core'
import { alerts } from './alert'
import { users } from './user'

export const invitations = pgTable('invitations', {
  acceptedAt: timestamp('accepted_at'),
  alertId: text('alert_id')
    .notNull()
    .references(() => alerts.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  expiresAt: timestamp('expires_at')
    .notNull()
    .$defaultFn(() => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)),
  id: text('id').primaryKey().$defaultFn(nanoid),
  inviteeEmail: text('invitee_email').notNull(),
  inviterId: text('inviter_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  message: text('message'),
  token: text('token').notNull().unique().$defaultFn(nanoid), // 30 days
})

export const InvitationSchema = z
  .object({
    acceptedAt: z.coerce.date().nullable().openapi({ example: null }),
    alertId: z.string().openapi({ example: 'alert123' }),
    createdAt: z.coerce.date().openapi({ example: new Date() }),
    expiresAt: z.coerce.date().openapi({ example: new Date() }),
    id: z.string().openapi({ example: '123' }),
    inviteeEmail: z
      .string()
      .email()
      .openapi({ example: 'invitee@example.com' }),
    inviterId: z.string().openapi({ example: 'user123' }),
    message: z
      .string()
      .nullable()
      .openapi({ example: 'Check out this alert!' }),
    token: z.string().openapi({ example: 'token123' }),
  })
  .openapi({ ref: 'InvitationSchema' })

export const InvitationCreateSchema = z
  .object({
    emails: z
      .array(z.string().email())
      .min(1)
      .max(100)
      .openapi({
        description: 'Array of email addresses to invite',
        example: ['user1@example.com', 'user2@example.com'],
      }),
    message: z.string().optional().openapi({
      description: 'Optional custom message to include in the invitation',
      example: 'I think you would find this alert interesting!',
    }),
  })
  .openapi({ ref: 'InvitationCreateSchema' })

export type Invitation = z.infer<typeof InvitationSchema>
export type InvitationCreate = z.infer<typeof InvitationCreateSchema>

export const invitationsRelations = relations(invitations, ({ one }) => ({
  alert: one(alerts, {
    fields: [invitations.alertId],
    references: [alerts.id],
  }),
  inviter: one(users, {
    fields: [invitations.inviterId],
    references: [users.id],
  }),
}))
