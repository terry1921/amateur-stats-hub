
import { collection, getDocs, Timestamp, query, orderBy, addDoc, doc, updateDoc, runTransaction, writeBatch } from 'firebase/firestore';
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
  
  let newRank = 1;
  try {
    // This transaction is simple and might not be strictly necessary if eventual consistency for rank is okay on add.
    // The main "Update Ranks" button will be the source of truth for correct ranking.
    await runTransaction(db, async (transaction) => {
      const teamSnapshot = await transaction.get(query(teamsCol)); 
      newRank = teamSnapshot.size + 1;
    });
  } catch (e) {
    console.error("Transaction failed to determine initial rank: ", e);
    // Fallback or rethrow, here we just use a potentially less accurate count if transaction fails
    const currentTeams = await getDocs(query(teamsCol));
    newRank = currentTeams.size + 1;
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

  const updatedData: Partial<Omit<TeamStats, 'id' | 'name' | 'rank'>> & {goalDifference: number, points: number} = {
    played: stats.played,
    won: stats.won,
    drawn: stats.drawn,
    lost: stats.lost,
    goalsScored: stats.goalsScored,
    goalsConceded: stats.goalsConceded,
    goalDifference,
    points,
  };
  
  await updateDoc(teamRef, updatedData);
}

export async function updateAllTeamRanks(): Promise<void> {
  const teamsCol = collection(db, 'teams');
  const teamSnapshot = await getDocs(teamsCol);
  
  const teams = teamSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as TeamStats));

  // Sort teams: 1. by points (desc), 2. by goal difference (desc)
  teams.sort((a, b) => {
    if (b.points !== a.points) {
      return b.points - a.points;
    }
    if (b.goalDifference !== a.goalDifference) {
      return b.goalDifference - a.goalDifference;
    }
    // Optional: if points and GD are same, sort by name for stable ranking (not strictly required by prompt)
    return a.name.localeCompare(b.name); 
  });

  const batch = writeBatch(db);
  teams.forEach((team, index) => {
    const teamRef = doc(db, 'teams', team.id);
    batch.update(teamRef, { rank: index + 1 });
  });

  await batch.commit();
}
