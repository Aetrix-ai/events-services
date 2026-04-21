import { pgTable, serial, text, timestamp, varchar, integer, date } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Credentials table for authentication
export const credentials = pgTable('credentials', {
  id: serial('id').primaryKey(),
  username: varchar('username', { length: 255 }).notNull().unique(),
  password: varchar('password', { length: 255 }).notNull(), // Store hashed passwords
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Events table
export const events = pgTable('events', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  date: date('date').notNull(),
  location: varchar('location', { length: 255 }).notNull(),
  description: text('description'),
  owner: varchar('owner', { length: 255 }).notNull(),
  teamSize: integer('team_size').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Teams table
export const teams = pgTable('teams', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  eventId: integer('event_id').notNull().references(() => events.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Registrations table
export const registrations = pgTable('registrations', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  college: varchar('college', { length: 255 }).notNull(),
  branch: varchar('branch', { length: 255 }).notNull(),
  semester: integer('semester').notNull(),
  teamId: integer('team_id').references(() => teams.id, { onDelete: 'cascade' }),
  eventId: integer('event_id').notNull().references(() => events.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Define relations for better query experience
export const eventsRelations = relations(events, ({ many }) => ({
  teams: many(teams),
  registrations: many(registrations),
}));

export const teamsRelations = relations(teams, ({ one, many }) => ({
  event: one(events, {
    fields: [teams.eventId],
    references: [events.id],
  }),
  members: many(registrations),
}));

export const registrationsRelations = relations(registrations, ({ one }) => ({
  team: one(teams, {
    fields: [registrations.teamId],
    references: [teams.id],
  }),
  event: one(events, {
    fields: [registrations.eventId],
    references: [events.id],
  }),
}));

// Export schema for drizzle
export const schema = {
  credentials,
  events,
  teams,
  registrations,
  eventsRelations,
  teamsRelations,
  registrationsRelations,
};

// Type exports for TypeScript
export type Credential = typeof credentials.$inferSelect;
export type NewCredential = typeof credentials.$inferInsert;

export type Event = typeof events.$inferSelect;
export type NewEvent = typeof events.$inferInsert;

export type Team = typeof teams.$inferSelect;
export type NewTeam = typeof teams.$inferInsert;

export type Registration = typeof registrations.$inferSelect;
export type NewRegistration = typeof registrations.$inferInsert;

// Made with Bob
