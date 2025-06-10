
import { collection, getDocs, Timestamp, query, orderBy, addDoc, doc, updateDoc, runTransaction, writeBatch, setDoc, deleteDoc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { TeamStats, MatchInfo, NewMatchInput, UserRole, UserProfile } from '@/types';
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
    await runTransaction(db, async (transaction) => {
      const teamSnapshot = await transaction.get(query(teamsCol)); 
      newRank = teamSnapshot.size + 1;
    });
  } catch (e) {
    console.error("Transaction failed to determine initial rank: ", e);
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
  const newMatchRef = doc(matchesCol);
  const newId = newMatchRef.id; 

  const { date, time, ...restOfMatchInput } = matchInput;
  
  if (!date || !time) {
    throw new Error("Date and time are required to create a match.");
  }
  
  const dateTimeString = `${date}T${time}:00`; 
  const matchDateTime = parseISO(dateTimeString);

  if (isNaN(matchDateTime.getTime())) {
    throw new Error("Invalid date or time format provided.");
  }

  const newMatchData = {
    id: newId, 
    ...restOfMatchInput,
    dateTime: Timestamp.fromDate(matchDateTime),
  };

  await setDoc(newMatchRef, newMatchData);
  return newId; 
}

export async function updateMatchScore(matchId: string, homeScore: number, awayScore: number): Promise<void> {
  if (matchId === undefined || homeScore === undefined || awayScore === undefined) {
    throw new Error("Match ID and scores must be provided.");
  }
  if (typeof homeScore !== 'number' || typeof awayScore !== 'number' || homeScore < 0 || awayScore < 0) {
    throw new Error("Scores must be non-negative numbers.");
  }

  const matchRef = doc(db, 'matches', matchId);
  try {
    await updateDoc(matchRef, {
      homeScore: homeScore,
      awayScore: awayScore,
    });
  } catch (error) {
    console.error("Error updating match score in Firestore: ", error);
    throw new Error("Could not update match score in database.");
  }
}

export async function deleteMatch(matchId: string): Promise<void> {
  if (!matchId) {
    throw new Error("Match ID must be provided to delete a match.");
  }
  const matchRef = doc(db, 'matches', matchId);
  try {
    await deleteDoc(matchRef);
  } catch (error) {
    console.error("Error deleting match from Firestore: ", error);
    throw new Error("Could not delete match from database.");
  }
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const userRef = doc(db, 'users', uid);
  const userSnap = await getDoc(userRef);

  if (userSnap.exists()) {
    const data = userSnap.data();
    return {
      uid: userSnap.id,
      email: data.email,
      displayName: data.displayName,
      role: data.role as UserRole,
      createdAt: (data.createdAt as Timestamp).toDate(),
      updatedAt: (data.updatedAt as Timestamp).toDate(),
    } as UserProfile;
  } else {
    return null;
  }
}

export async function createUserProfile(
  uid: string,
  email: string | null,
  displayName: string | null,
  role: UserRole
): Promise<UserProfile> {
  const userRef = doc(db, 'users', uid);
  const now = new Date();
  const newUserProfile: Omit<UserProfile, 'uid' | 'createdAt' | 'updatedAt'> & {createdAt: Timestamp, updatedAt: Timestamp } = {
    email,
    displayName,
    role,
    createdAt: Timestamp.fromDate(now),
    updatedAt: Timestamp.fromDate(now),
  };
  await setDoc(userRef, newUserProfile);
  return { uid, ...newUserProfile, createdAt: now, updatedAt: now };
}
