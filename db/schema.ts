import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core'

export const tasks = sqliteTable('tasks', {
  id: text('id').primaryKey(),
  text: text('text').notNull(),
  status: text('status', { enum: ['todo', 'done'] }).notNull().default('todo'),
  priority: integer('priority').notNull().default(1),
  date: text('date').notNull(),
  createdAt: integer('created_at', { mode: 'number' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'number' }).notNull(),
})

export const notes = sqliteTable('notes', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  content: text('content').default(''),
  tags: text('tags').default('[]'),
  createdAt: integer('created_at', { mode: 'number' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'number' }).notNull(),
})

export const caldavAccounts = sqliteTable('caldav_accounts', {
  id: text('id').primaryKey(),
  serverUrl: text('server_url').notNull(),
  username: text('username').notNull(),
  password: text('password').notNull(),
  displayName: text('display_name').notNull(),
  lastSyncAt: integer('last_sync_at', { mode: 'number' }),
  syncToken: text('sync_token'),
  createdAt: integer('created_at', { mode: 'number' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'number' }).notNull(),
})

export const calendars = sqliteTable('calendars', {
  id: text('id').primaryKey(),
  accountId: text('account_id').notNull().references(() => caldavAccounts.id, { onDelete: 'cascade' }),
  url: text('url').notNull(),
  displayName: text('display_name').notNull(),
  color: text('color').default('#3b82f6'),
  ctag: text('ctag'),
  syncToken: text('sync_token'),
  enabled: integer('enabled', { mode: 'boolean' }).notNull().default(true),
  createdAt: integer('created_at', { mode: 'number' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'number' }).notNull(),
})

export const events = sqliteTable('events', {
  id: text('id').primaryKey(),
  calendarId: text('calendar_id').notNull().references(() => calendars.id, { onDelete: 'cascade' }),
  uid: text('uid').notNull(),
  etag: text('etag'),
  url: text('url'),
  title: text('title').notNull(),
  description: text('description').default(''),
  location: text('location').default(''),
  startAt: text('start_at').notNull(),
  endAt: text('end_at').notNull(),
  allDay: integer('all_day', { mode: 'boolean' }).notNull().default(false),
  status: text('status', { enum: ['confirmed', 'tentative', 'cancelled'] }).default('confirmed'),
  rawIcal: text('raw_ical').notNull(),
  createdAt: integer('created_at', { mode: 'number' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'number' }).notNull(),
})
