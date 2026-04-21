// import { db } from '../lib/db';
// import { events, teams, registrations, credentials } from './schema';
// import { eq, and } from 'drizzle-orm';

// /**
//  * Example queries for the event management system
//  * Use these as reference for building your API endpoints
//  */

// // ============= CREDENTIALS =============

// // Create new user credentials
// export async function createCredentials(username: string, hashedPassword: string) {
//   return await db.insert(credentials).values({
//     username,
//     password: hashedPassword,
//   }).returning();
// }

// // Find user by username
// export async function findUserByUsername(username: string) {
//   return await db.select().from(credentials).where(eq(credentials.username, username));
// }

// // ============= EVENTS =============

// // Create a new event
// export async function createEvent(eventData: {
//   name: string;
//   date: string;
//   location: string;
//   description?: string;
//   owner: string;
//   teamSize: number;
// }) {
//   return await db.insert(events).values(eventData).returning();
// }

// // Get all events
// export async function getAllEvents() {
//   return await db.select().from(events);
// }

// // Get event by ID with all registrations
// export async function getEventWithRegistrations(eventId: number) {
//   return await db.query.events.findFirst({
//     where: eq(events.id, eventId),
//     with: {
//       registrations: true,
//       teams: {
//         with: {
//           members: true,
//         },
//       },
//     },
//   });
// }

// // Update event
// export async function updateEvent(eventId: number, updates: Partial<typeof events.$inferInsert>) {
//   return await db.update(events)
//     .set({ ...updates, updatedAt: new Date() })
//     .where(eq(events.id, eventId))
//     .returning();
// }

// // Delete event
// export async function deleteEvent(eventId: number) {
//   return await db.delete(events).where(eq(events.id, eventId));
// }

// // ============= TEAMS =============

// // Create a new team for an event
// export async function createTeam(teamName: string, eventId: number) {
//   return await db.insert(teams).values({
//     name: teamName,
//     eventId,
//   }).returning();
// }

// // Get team with all members
// export async function getTeamWithMembers(teamId: number) {
//   return await db.query.teams.findFirst({
//     where: eq(teams.id, teamId),
//     with: {
//       members: true,
//       event: true,
//     },
//   });
// }

// // Get all teams for an event
// export async function getTeamsByEvent(eventId: number) {
//   return await db.query.teams.findMany({
//     where: eq(teams.eventId, eventId),
//     with: {
//       members: true,
//     },
//   });
// }

// // ============= REGISTRATIONS =============

// // Register a participant (create new team)
// export async function registerWithNewTeam(
//   participantData: {
//     name: string;
//     college: string;
//     branch: string;
//     semester: number;
//   },
//   teamName: string,
//   eventId: number
// ) {
//   // Create team first
//   const [team] = await createTeam(teamName, eventId);
  
//   // Then create registration
//   return await db.insert(registrations).values({
//     ...participantData,
//     teamId: team.id,
//     eventId,
//   }).returning();
// }

// // Register a participant (join existing team)
// export async function registerWithExistingTeam(
//   participantData: {
//     name: string;
//     college: string;
//     branch: string;
//     semester: number;
//   },
//   teamId: number,
//   eventId: number
// ) {
//   return await db.insert(registrations).values({
//     ...participantData,
//     teamId,
//     eventId,
//   }).returning();
// }

// // Get all registrations for an event
// export async function getRegistrationsByEvent(eventId: number) {
//   return await db.query.registrations.findMany({
//     where: eq(registrations.eventId, eventId),
//     with: {
//       team: true,
//     },
//   });
// }

// // Get registration by ID
// export async function getRegistrationById(registrationId: number) {
//   return await db.query.registrations.findFirst({
//     where: eq(registrations.id, registrationId),
//     with: {
//       team: {
//         with: {
//           members: true,
//         },
//       },
//       event: true,
//     },
//   });
// }

// // Update registration
// export async function updateRegistration(
//   registrationId: number,
//   updates: Partial<typeof registrations.$inferInsert>
// ) {
//   return await db.update(registrations)
//     .set({ ...updates, updatedAt: new Date() })
//     .where(eq(registrations.id, registrationId))
//     .returning();
// }

// // Delete registration
// export async function deleteRegistration(registrationId: number) {
//   return await db.delete(registrations).where(eq(registrations.id, registrationId));
// }

// // Check if team is full
// export async function isTeamFull(teamId: number) {
//   const team = await db.query.teams.findFirst({
//     where: eq(teams.id, teamId),
//     with: {
//       event: true,
//       members: true,
//     },
//   });
  
//   if (!team) return false;
  
//   return team.members.length >= team.event.teamSize;
// }

// // Made with Bob
