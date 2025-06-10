
import { collection, getDocs, Timestamp, query, orderBy, addDoc, doc, updateDoc, runTransaction, writeBatch, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { TeamStats, MatchInfo, NewMatchInput } from '@/types';
import { parseISO } from 'date-fns';

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
    return a.name.localeCompare(b.name); 
  });

  const batch = writeBatch(db);
  teams.forEach((team, index) => {
    const teamRef = doc(db, 'teams', team.id);
    batch.update(teamRef, { rank: index + 1 });
  });

  await batch.commit();
}

export async function addMatch(matchInput: NewMatchInput): Promise<string> {
  const matchesCol = collection(db, 'matches');
  
  // Generate a new DocumentReference with an auto-generated ID
  const newMatchRef = doc(matchesCol);
  const newId = newMatchRef.id; // This is the random string ID

  const { date, time, ...restOfMatchInput } = matchInput;
  
  // Combine date and time strings and parse into a JavaScript Date object
  // Ensure date and time are valid before attempting to parse
  if (!date || !time) {
    throw new Error("Date and time are required to create a match.");
  }
  
  const dateTimeString = `${date}T${time}:00`; // Assuming time is HH:MM
  const matchDateTime = parseISO(dateTimeString);

  if (isNaN(matchDateTime.getTime())) {
    throw new Error("Invalid date or time format provided.");
  }

  const newMatchData = {
    ...restOfMatchInput,
    dateTime: Timestamp.fromDate(matchDateTime),
    // homeScore and awayScore will be undefined initially for an upcoming match
  };

  // Use setDoc with the DocumentReference that has the auto-generated ID
  await setDoc(newMatchRef, newMatchData);
  
  return newId; // Return the generated ID
}

