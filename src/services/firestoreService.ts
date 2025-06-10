
import { collection, getDocs, Timestamp, query, orderBy, addDoc, doc, updateDoc, runTransaction } from 'firebase/firestore';
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

export async function addTeam(teamName: string): Promise<string> {
  const teamsCol = collection(db, 'teams');
  
  // Get current number of teams to determine rank in a transaction for consistency
  let newRank = 1;
  try {
    await runTransaction(db, async (transaction) => {
      const teamSnapshot = await transaction.get(query(teamsCol)); // Get all teams to count
      newRank = teamSnapshot.size + 1;
    });
  } catch (e) {
    console.error("Transaction failed: ", e);
    throw new Error("Failed to determine team rank due to a database error.");
  }


  const newTeamData: Omit<TeamStats, 'id' | 'rank'> & { rank: number } = {
    name: teamName,
    rank: newRank, 
    played: 0,
    won: 0,
    drawn: 0,
    lost: 0,
    goalsScored: 0,
    goalsConceded: 0,
    goalDifference: 0,
    points: 0,
  };

  const docRef = await addDoc(teamsCol, newTeamData);
  return docRef.id; 
}

export type UpdateTeamStatsInput = {
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsScored: number;
  goalsConceded: number;
};

export async function updateTeamStats(teamId: string, stats: UpdateTeamStatsInput): Promise<void> {
  const teamRef = doc(db, 'teams', teamId);

  const goalDifference = stats.goalsScored - stats.goalsConceded;
  const points = stats.won * 3 + stats.drawn * 1;

  const updatedData: Partial<TeamStats> = {
    ...stats,
    goalDifference,
    points,
  };

  // Note: This function does not automatically update ranks.
  // Rank updates would require re-evaluating all teams and are a more complex operation.
  await updateDoc(teamRef, updatedData);
}
