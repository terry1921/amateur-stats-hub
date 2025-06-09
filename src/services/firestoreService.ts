
import { collection, getDocs, Timestamp, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { TeamStats, MatchInfo } from '@/types';

export async function getTeams(): Promise<TeamStats[]> {
  const teamsCol = collection(db, 'teams');
  // Order by rank ascending by default
  const q = query(teamsCol, orderBy('rank', 'asc'));
  const teamSnapshot = await getDocs(q);
  const teamList = teamSnapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      rank: data.rank,
      name: data.name,
      played: data.played,
      won: data.won,
      drawn: data.drawn,
      lost: data.lost,
      goalsScored: data.goalsScored,
      goalsConceded: data.goalsConceded,
      goalDifference: data.goalDifference,
      points: data.points,
    } as TeamStats;
  });
  return teamList;
}

export async function getMatches(): Promise<MatchInfo[]> {
  const matchesCol = collection(db, 'matches');
  // Order by dateTime ascending
  const q = query(matchesCol, orderBy('dateTime', 'asc'));
  const matchSnapshot = await getDocs(q);
  const matchList = matchSnapshot.docs.map(doc => {
    const data = doc.data();
    const dateTime = (data.dateTime as Timestamp).toDate();
    return {
      id: doc.id,
      homeTeam: data.homeTeam,
      awayTeam: data.awayTeam,
      location: data.location,
      dateTime: dateTime,
      homeScore: data.homeScore, // May be undefined
      awayScore: data.awayScore, // May be undefined
    } as MatchInfo;
  });
  return matchList;
}
