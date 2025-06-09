import type { TeamStats, MatchInfo } from '@/types';

export const mockTeams: TeamStats[] = [
  { id: '1', rank: 1, name: 'Dragons FC', played: 10, won: 8, drawn: 1, lost: 1, goalsScored: 25, goalsConceded: 5, goalDifference: 20, points: 25 },
  { id: '2', rank: 2, name: 'Warriors United', played: 10, won: 7, drawn: 2, lost: 1, goalsScored: 20, goalsConceded: 8, goalDifference: 12, points: 23 },
  { id: '3', rank: 3, name: 'Titans AFC', played: 10, won: 6, drawn: 1, lost: 3, goalsScored: 15, goalsConceded: 10, goalDifference: 5, points: 19 },
  { id: '4', rank: 4, name: 'Eagles SC', played: 10, won: 5, drawn: 3, lost: 2, goalsScored: 18, goalsConceded: 12, goalDifference: 6, points: 18 },
  { id: '5', rank: 5, name: 'Phoenix Rising', played: 10, won: 4, drawn: 2, lost: 4, goalsScored: 12, goalsConceded: 15, goalDifference: -3, points: 14 },
  { id: '6', rank: 6, name: 'Cobras FC', played: 10, won: 3, drawn: 2, lost: 5, goalsScored: 10, goalsConceded: 18, goalDifference: -8, points: 11 },
  { id: '7', rank: 7, name: 'Sharks Athletic', played: 10, won: 2, drawn: 1, lost: 7, goalsScored: 8, goalsConceded: 22, goalDifference: -14, points: 7 },
  { id: '8', rank: 8, name: 'Lions Pride', played: 10, won: 0, drawn: 2, lost: 8, goalsScored: 5, goalsConceded: 23, goalDifference: -18, points: 2 },
];

export const mockMatches: MatchInfo[] = [
  { id: 'm1', homeTeam: 'Dragons FC', awayTeam: 'Warriors United', location: 'Central Stadium', dateTime: new Date(new Date().setDate(new Date().getDate() + 7)) },
  { id: 'm2', homeTeam: 'Titans AFC', awayTeam: 'Eagles SC', location: 'North Park', dateTime: new Date(new Date().setDate(new Date().getDate() + 7)) },
  { id: 'm3', homeTeam: 'Phoenix Rising', awayTeam: 'Cobras FC', location: 'East Arena', dateTime: new Date(new Date().setDate(new Date().getDate() + 8)) },
  { id: 'm4', homeTeam: 'Sharks Athletic', awayTeam: 'Lions Pride', location: 'West Field', dateTime: new Date(new Date().setDate(new Date().getDate() + 8)) },
  { id: 'm5', homeTeam: 'Dragons FC', awayTeam: 'Titans AFC', location: 'Central Stadium', dateTime: new Date(new Date().setDate(new Date().getDate() + 14)) },
  { id: 'm6', homeTeam: 'Warriors United', awayTeam: 'Eagles SC', location: 'North Park', dateTime: new Date(new Date().setDate(new Date().getDate() + 14)) },
];
