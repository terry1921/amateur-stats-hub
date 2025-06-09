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
};

export type MatchInfo = {
  id: string;
  homeTeam: string;
  awayTeam: string;
  location: string;
  dateTime: Date;
  homeScore?: number; // Optional, for past matches
  awayScore?: number; // Optional, for past matches
};
