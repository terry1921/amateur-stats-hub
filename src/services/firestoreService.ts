
import { collection, getDocs, Timestamp, query, orderBy, addDoc, doc, updateDoc, runTransaction, writeBatch, setDoc, deleteDoc, getDoc, serverTimestamp, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { TeamStats, MatchInfo, NewMatchInput, UserRole, UserProfile, League } from '@/types';
import { parseISO } from 'date-fns';

// LEAGUE FUNCTIONS
export async function addLeague(name: string): Promise<string> {
  const leaguesCol = collection(db, 'leagues');
  const newLeagueRef = doc(leaguesCol);
  const newLeagueData = {
    id: newLeagueRef.id,
    name: name,
    createdAt: serverTimestamp(), // Use server timestamp
  };
  await setDoc(newLeagueRef, newLeagueData);
  return newLeagueRef.id;
}

export async function getLeagues(): Promise<League[]> {
  const leaguesCol = collection(db, 'leagues');
  const q = query(leaguesCol, orderBy('name', 'asc')); // Order by name
  const leagueSnapshot = await getDocs(q);
  return leagueSnapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      name: data.name,
      createdAt: (data.createdAt as Timestamp)?.toDate() || new Date(), // Handle case where createdAt might be pending
    } as League;
  });
}

// TEAM FUNCTIONS (TODO: Add leagueId filtering)
export async function getTeams(leagueId?: string): Promise<TeamStats[]> {
  const teamsCol = collection(db, 'teams');
  // Placeholder: In the future, this query will filter by leagueId if provided
  // const q = leagueId ? query(teamsCol, where('leagueId', '==', leagueId), orderBy('rank', 'asc')) : query(teamsCol, orderBy('rank', 'asc'));
  const q = query(teamsCol, orderBy('rank', 'asc')); // Current global fetch
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
      leagueId: data.leagueId,
    } as TeamStats;
  });
  return teamList;
}

export async function addTeam(teamName: string, leagueId: string): Promise<string> {
  const teamsCol = collection(db, 'teams');
  
  let newRank = 1;
  try {
    await runTransaction(db, async (transaction) => {
      // Placeholder: Future query will filter by leagueId
      // const teamSnapshot = await transaction.get(query(teamsCol, where('leagueId', '==', leagueId)));
      const teamSnapshot = await transaction.get(query(teamsCol));
      newRank = teamSnapshot.size + 1;
    });
  } catch (e) {
    console.error("Transaction failed to determine initial rank: ", e);
    // const currentTeams = await getDocs(query(teamsCol, where('leagueId', '==', leagueId)));
    const currentTeams = await getDocs(query(teamsCol));
    newRank = currentTeams.size + 1;
  }

  const newTeamData = {
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
    leagueId: leagueId, // Store leagueId
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

export async function updateTeamStats(teamId: string, stats: UpdateTeamStatsInput, leagueId?: string): Promise<void> {
  // Placeholder: leagueId might be used for validation or specific logic in future
  const teamRef = doc(db, 'teams', teamId);

  const goalDifference = stats.goalsScored - stats.goalsConceded;
  const points = stats.won * 3 + stats.drawn * 1;

  const updatedData: Partial<Omit<TeamStats, 'id' | 'name' | 'rank' | 'leagueId'>> & {goalDifference: number, points: number} = {
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

export async function updateAllTeamRanks(leagueId?: string): Promise<void> {
  // Placeholder: Future query will filter by leagueId
  // const q = leagueId ? query(collection(db, 'teams'), where('leagueId', '==', leagueId)) : collection(db, 'teams');
  const teamSnapshot = await getDocs(collection(db, 'teams'));
  
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


// MATCH FUNCTIONS (TODO: Add leagueId filtering)
export async function getMatches(leagueId?: string): Promise<MatchInfo[]> {
  const matchesCol = collection(db, 'matches');
  // Placeholder: In the future, this query will filter by leagueId if provided
  // const q = leagueId ? query(matchesCol, where('leagueId', '==', leagueId), orderBy('dateTime', 'asc')) : query(matchesCol, orderBy('dateTime', 'asc'));
  const q = query(matchesCol, orderBy('dateTime', 'asc')); // Current global fetch
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
      homeScore: data.homeScore,
      awayScore: data.awayScore,
      leagueId: data.leagueId,
    } as MatchInfo;
  });
  return matchList;
}

export async function addMatch(matchInput: NewMatchInput): Promise<string> {
  const matchesCol = collection(db, 'matches');
  const newMatchRef = doc(matchesCol);
  const newId = newMatchRef.id; 

  const { date, time, leagueId, ...restOfMatchInput } = matchInput;
  
  if (!date || !time) {
    throw new Error("Date and time are required to create a match.");
  }
  if (!leagueId) {
    throw new Error("League ID is required to create a match.");
  }
  
  const dateTimeString = `${date}T${time}:00`; 
  const matchDateTime = parseISO(dateTimeString);

  if (isNaN(matchDateTime.getTime())) {
    throw new Error("Invalid date or time format provided.");
  }

  const newMatchData = {
    id: newId,
    ...restOfMatchInput,
    leagueId: leagueId, // Store leagueId
    dateTime: Timestamp.fromDate(matchDateTime),
  };

  await setDoc(newMatchRef, newMatchData);
  return newId;
}

export async function updateMatchScore(matchId: string, homeScore: number, awayScore: number, leagueId?: string): Promise<void> {
  // Placeholder: leagueId for future validation
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

export async function deleteMatch(matchId: string, leagueId?: string): Promise<void> {
  // Placeholder: leagueId for future validation
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


// USER FUNCTIONS
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

export async function getAllUsers(): Promise<UserProfile[]> {
  const usersCol = collection(db, 'users');
  const userSnapshot = await getDocs(usersCol);
  const userList = userSnapshot.docs.map(doc => {
    const data = doc.data();
    return {
      uid: doc.id,
      email: data.email,
      displayName: data.displayName || 'N/A',
      role: data.role as UserRole,
      createdAt: (data.createdAt as Timestamp).toDate(),
      updatedAt: (data.updatedAt as Timestamp).toDate(),
    } as UserProfile;
  });
  return userList.sort((a,b) => (a.email || "").localeCompare(b.email || ""));
}

export async function updateUserRole(uid: string, newRole: UserRole): Promise<void> {
  const userRef = doc(db, 'users', uid);
  await updateDoc(userRef, {
    role: newRole,
    updatedAt: Timestamp.fromDate(new Date()),
  });
}
