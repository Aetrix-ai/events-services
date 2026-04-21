export type AdminUser = {
  id: string;
  username: string;
  password: string;
  fullName: string;
};

export type EventRecord = {
  id: string;
  name: string;
  date: string;
  location: string;
  ownerId: string;
  involvedAdminIds: string[];
};

export type RegistrationRecord = {
  id: string;
  eventId: string;
  attendeeName: string;
  email: string;
  status: "confirmed" | "pending" | "cancelled";
  teamId: string;
};

export type TeamRecord = {
  id: string;
  eventId: string;
  teamName: string;
  leadEmail: string;
  membersCount: number;
};

export const adminUsers: AdminUser[] = [
  { id: "admin-1", username: "sara", password: "sara123", fullName: "Sara Khan" },
  { id: "admin-2", username: "ravi", password: "ravi123", fullName: "Ravi Iyer" },
  { id: "admin-3", username: "nina", password: "nina123", fullName: "Nina Shah" },
];

export const events: EventRecord[] = [
  {
    id: "event-1",
    name: "Aetrix Summit 2026",
    date: "2026-05-14",
    location: "Bengaluru",
    ownerId: "admin-1",
    involvedAdminIds: ["admin-1", "admin-2"],
  },
  {
    id: "event-2",
    name: "Developer Hacknight",
    date: "2026-06-02",
    location: "Hyderabad",
    ownerId: "admin-2",
    involvedAdminIds: ["admin-2", "admin-3"],
  },
  {
    id: "event-3",
    name: "AI Product Bootcamp",
    date: "2026-06-21",
    location: "Remote",
    ownerId: "admin-3",
    involvedAdminIds: ["admin-1", "admin-3"],
  },
];

export const registrations: RegistrationRecord[] = [
  { id: "reg-1", eventId: "event-1", attendeeName: "Asha Patel", email: "asha@example.com", status: "confirmed", teamId: "team-1" },
  { id: "reg-2", eventId: "event-1", attendeeName: "Karan Mehta", email: "karan@example.com", status: "pending", teamId: "team-2" },
  { id: "reg-3", eventId: "event-2", attendeeName: "Maya Reddy", email: "maya@example.com", status: "confirmed", teamId: "team-3" },
  { id: "reg-4", eventId: "event-2", attendeeName: "Rohit Jain", email: "rohit@example.com", status: "cancelled", teamId: "team-4" },
  { id: "reg-5", eventId: "event-3", attendeeName: "Dev Nair", email: "dev@example.com", status: "pending", teamId: "team-5" },
];

export const teams: TeamRecord[] = [
  { id: "team-1", eventId: "event-1", teamName: "Logistics", leadEmail: "lead.logistics@example.com", membersCount: 6 },
  { id: "team-2", eventId: "event-1", teamName: "Speaker Ops", leadEmail: "lead.speaker@example.com", membersCount: 4 },
  { id: "team-3", eventId: "event-2", teamName: "Hack Support", leadEmail: "lead.hacksupport@example.com", membersCount: 5 },
  { id: "team-4", eventId: "event-2", teamName: "Onboarding", leadEmail: "lead.onboarding@example.com", membersCount: 3 },
  { id: "team-5", eventId: "event-3", teamName: "Curriculum", leadEmail: "lead.curriculum@example.com", membersCount: 7 },
];
