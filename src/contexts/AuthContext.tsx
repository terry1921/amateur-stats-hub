
'use client';

import type { ReactNode, Dispatch, SetStateAction } from 'react';
import { createContext, useContext, useEffect, useState } from 'react';
import {
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  type User as FirebaseUser,
} from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import { getUserProfile, createUserProfile } from '@/services/firestoreService';
import type { UserRole, UserProfile } from '@/types';

interface AuthContextType {
  currentUser: FirebaseUser | null;
  userProfile: UserProfile | null; // Changed from userRole to full profile
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signUpWithEmail: (email: string, pass: string, displayName: string) => Promise<FirebaseUser | null>;
  signInWithEmail: (email: string, pass: string) => Promise<FirebaseUser | null>;
  signOutUser: () => Promise<void>;
  isAuthenticating: boolean;
  setIsAuthenticating: Dispatch<SetStateAction<boolean>>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setLoading(true);
      if (firebaseUser) {
        setCurrentUser(firebaseUser);
        let profile = await getUserProfile(firebaseUser.uid);
        if (!profile) {
          // If profile doesn't exist, create one with default role "Viewer"
          profile = await createUserProfile(
            firebaseUser.uid,
            firebaseUser.email,
            firebaseUser.displayName, // This will be picked up after updateProfile
            'Viewer' // Default role
          );
        }
        setUserProfile(profile);
      } else {
        setCurrentUser(null);
        setUserProfile(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleAuthSuccess = (user: FirebaseUser) => {
    // onAuthStateChanged will handle profile fetching/creation
    router.push('/');
  };

  const signInWithGoogle = async () => {
    setIsAuthenticating(true);
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      if (result.user) {
        // For Google Sign-In, displayName is usually set by Google.
        // The onAuthStateChanged listener will handle profile creation/fetching.
        handleAuthSuccess(result.user);
      }
    } catch (error) {
      console.error("Error signing in with Google:", error);
    } finally {
      setIsAuthenticating(false);
    }
  };

  const signUpWithEmail = async (email: string, pass: string, displayName: string): Promise<FirebaseUser | null> => {
    setIsAuthenticating(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
      const user = userCredential.user;
      // Update Firebase Auth profile with displayName
      await updateProfile(user, { displayName });
      // setCurrentUser explicitly here to ensure firebaseUser.displayName is available for createUserProfile in onAuthStateChanged
      // although onAuthStateChanged should pick it up, this makes it more robust for immediate profile creation.
      // However, the onAuthStateChanged listener is the primary handler for profile creation.
      // Forcing a refresh or re-fetch within onAuthStateChanged might be needed if timing is an issue.
      // For now, relying on onAuthStateChanged after updateProfile.
      handleAuthSuccess(user);
      return user;
    } catch (error) {
      console.error("Error signing up with email:", error);
      throw error;
    } finally {
      setIsAuthenticating(false);
    }
  };

  const signInWithEmail = async (email: string, pass: string): Promise<FirebaseUser | null> => {
    setIsAuthenticating(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, pass);
      handleAuthSuccess(userCredential.user);
      return userCredential.user;
    } catch (error) {
      console.error("Error signing in with email:", error);
      throw error;
    } finally {
      setIsAuthenticating(false);
    }
  };

  const signOutUser = async () => {
    setIsAuthenticating(true);
    try {
      await signOut(auth);
      router.push('/login');
    } catch (error) {
      console.error("Error signing out:", error);
    } finally {
      setIsAuthenticating(false);
    }
  };

  const value = {
    currentUser,
    userProfile,
    loading,
    signInWithGoogle,
    signUpWithEmail,
    signInWithEmail,
    signOutUser,
    isAuthenticating,
    setIsAuthenticating,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
