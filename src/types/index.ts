
export const USER_ROLES = ['Creator', 'Viewer', 'Member', 'Administrator'] as const;
export type UserRole = typeof USER_ROLES[number];

export type League = {
  id: string;
  name: string;
  createdAt: Date; // Stored as Timestamp in Firestore
};

export type TeamStats = {
  id: string;
  rank: number;
  name: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsScored: number;
  goalsConceded: number;
  goalDifference: number;
  points: number;
  leagueId?: string; // Optional for now, will become required
};

export type MatchInfo = {
  id: string;
  homeTeam: string;
  awayTeam: string;
  location: string;
  dateTime: Date;
  homeScore?: number; // Optional, for past matches
  awayScore?: number; // Optional, for past matches
  leagueId?: string; // Optional for now, will become required
};

// Input type for adding a new match, before it has an ID from Firestore
// and dateTime is initially a string from form input.
export type NewMatchInput = {
  homeTeam: string;
  awayTeam: string;
  location: string;
  date: string; // Date as string (YYYY-MM-DD)
  time: string; // Time as string (HH:MM)
  leagueId: string; // Will be required
};

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  role: UserRole;
  createdAt: Date; // Stored as Timestamp in Firestore, converted to Date in app
  updatedAt: Date; // Stored as Timestamp in Firestore, converted to Date in app
}
