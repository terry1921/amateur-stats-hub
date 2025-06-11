
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
    createdAt: serverTimestamp(), 
  };
  await setDoc(newLeagueRef, newLeagueData);
  return newLeagueRef.id;
}

export async function getLeagues(): Promise<League[]> {
  const leaguesCol = collection(db, 'leagues');
  const q = query(leaguesCol, orderBy('name', 'asc')); 
  const leagueSnapshot = await getDocs(q);
  return leagueSnapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      name: data.name,
      createdAt: (data.createdAt as Timestamp)?.toDate() || new Date(), 
    } as League;
  });
}

// TEAM FUNCTIONS
export async function getTeams(leagueId: string): Promise<TeamStats[]> {
  if (!leagueId) {
    console.error("getTeams called without leagueId. This should not happen.");
    throw new Error("League ID is required to fetch teams.");
  }
  const teamsCol = collection(db, 'teams');
  const q = query(teamsCol, where('leagueId', '==', leagueId), orderBy('rank', 'asc'));
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
  if (!leagueId) {
    throw new Error("leagueId is required to add a team.");
  }
  const teamsCol = collection(db, 'teams');
  
  let newRank = 1;
  try {
    await runTransaction(db, async (transaction) => {
      const q = query(teamsCol, where('leagueId', '==', leagueId));
      const teamSnapshot = await transaction.get(q);
      newRank = teamSnapshot.size + 1;
    });
  } catch (e) {
    console.error("Transaction failed to determine initial rank for new team: ", e);
    // Fallback: Read outside transaction if transaction failed
    const currentTeamsQuery = query(teamsCol, where('leagueId', '==', leagueId));
    const currentTeams = await getDocs(currentTeamsQuery);
    newRank = currentTeams.size + 1;
  }

  const newTeamRef = doc(teamsCol); // Generate a new document reference for the ID
  const newTeamData = {
    id: newTeamRef.id, // Explicitly store the ID
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
    leagueId: leagueId, 
  };

  await setDoc(newTeamRef, newTeamData); // Use setDoc with the generated ID
  return newTeamRef.id; 
}

export type UpdateTeamStatsInput = {
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsScored: number;
  goalsConceded: number;
};

export async function updateTeamStats(teamId: string, stats: UpdateTeamStatsInput, leagueId: string): Promise<void> {
  if (!teamId) throw new Error("Team ID is required to update stats.");
  if (!leagueId) throw new Error("League ID is required for context when updating team stats.");
  
  const teamRef = doc(db, 'teams', teamId);

  // Optional: Validate that the team belongs to the league
  // const teamDocSnap = await getDoc(teamRef);
  // if (teamDocSnap.exists() && teamDocSnap.data().leagueId !== leagueId) {
  //   throw new Error(`Team ${teamId} does not belong to league ${leagueId}. Cannot update stats.`);
  // }

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

export async function updateAllTeamRanks(leagueId: string): Promise<void> {
  if (!leagueId) {
    throw new Error("leagueId is required to update team ranks.");
  }
  const q = query(collection(db, 'teams'), where('leagueId', '==', leagueId));
  const teamSnapshot = await getDocs(q);
  
  const teams = teamSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as TeamStats));

  teams.sort((a, b) => {
    if (b.points !== a.points) {
      return b.points - a.points;
    }
    if (b.goalDifference !== a.goalDifference) {
      return b.goalDifference - a.goalDifference;
    }
    if (b.goalsScored !== a.goalsScored) { // Secondary tie-breaker: more goals scored
        return b.goalsScored - a.goalsScored;
    }
    return a.name.localeCompare(b.name); // Tertiary tie-breaker: team name alphabetically
  });

  const batch = writeBatch(db);
  teams.forEach((team, index) => {
    const teamRef = doc(db, 'teams', team.id);
    batch.update(teamRef, { rank: index + 1 });
  });

  await batch.commit();
}


// MATCH FUNCTIONS
export async function getMatches(leagueId: string): Promise<MatchInfo[]> {
  if (!leagueId) {
    console.error("getMatches called without leagueId. This should not happen.");
    throw new Error("League ID is required to fetch matches.");
  }
  const matchesCol = collection(db, 'matches');
  const q = query(matchesCol, where('leagueId', '==', leagueId), orderBy('dateTime', 'asc'));
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

  const newMatchRef = doc(matchesCol); // Generate a new document reference for the ID
  const newId = newMatchRef.id; 

  const newMatchData = {
    id: newId, // Store the ID within the document
    ...restOfMatchInput,
    leagueId: leagueId, 
    dateTime: Timestamp.fromDate(matchDateTime),
    // homeScore and awayScore will be undefined by default for new matches
  };

  await setDoc(newMatchRef, newMatchData); // Use setDoc
  return newId;
}

export async function updateMatchScore(matchId: string, homeScore: number, awayScore: number, leagueId: string): Promise<void> {
  if (matchId === undefined || homeScore === undefined || awayScore === undefined) {
    throw new Error("Match ID and scores must be provided.");
  }
  if (typeof homeScore !== 'number' || typeof awayScore !== 'number' || homeScore < 0 || awayScore < 0) {
    throw new Error("Scores must be non-negative numbers.");
  }
  if (!leagueId) {
    throw new Error("League ID is required for context when updating match score.");
  }

  const matchRef = doc(db, 'matches', matchId);
  // Optional: Validate that the match belongs to the league
  // const matchDocSnap = await getDoc(matchRef);
  // if (matchDocSnap.exists() && matchDocSnap.data().leagueId !== leagueId) {
  //   throw new Error(`Match ${matchId} does not belong to league ${leagueId}. Cannot update score.`);
  // }
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

export async function deleteMatch(matchId: string, leagueId: string): Promise<void> {
  if (!matchId) {
    throw new Error("Match ID must be provided to delete a match.");
  }
  if (!leagueId) {
    throw new Error("League ID is required for context when deleting a match.");
  }
  const matchRef = doc(db, 'matches', matchId);
  // Optional: Validate that the match belongs to the league
  // const matchDocSnap = await getDoc(matchRef);
  // if (matchDocSnap.exists() && matchDocSnap.data().leagueId !== leagueId) {
  //   throw new Error(`Match ${matchId} does not belong to league ${leagueId}. Cannot delete.`);
  // }
  try {
    await deleteDoc(matchRef);
  } catch (error) {
    console.error("Error deleting match from Firestore: ", error);
    throw new Error("Could not delete match from database.");
  }
}


// USER FUNCTIONS (These are not league-specific, so they remain as is)
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
  const newUserProfileData: Omit<UserProfile, 'uid' | 'createdAt' | 'updatedAt'> & {createdAt: Timestamp, updatedAt: Timestamp } = {
    email,
    displayName,
    role,
    createdAt: Timestamp.fromDate(now),
    updatedAt: Timestamp.fromDate(now),
  };
  await setDoc(userRef, newUserProfileData);
  return { uid, ...newUserProfileData, createdAt: now, updatedAt: now };
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
