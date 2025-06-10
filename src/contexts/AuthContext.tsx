
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
  type User as FirebaseUser,
} from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useRouter } from 'next/navigation';

interface AuthContextType {
  currentUser: FirebaseUser | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signUpWithEmail: (email: string, pass: string) => Promise<FirebaseUser | null>;
  signInWithEmail: (email: string, pass: string) => Promise<FirebaseUser | null>;
  signOutUser: () => Promise<void>;
  isAuthenticating: boolean;
  setIsAuthenticating: Dispatch<SetStateAction<boolean>>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticating, setIsAuthenticating] = useState(false); // For UI feedback during auth operations
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    setIsAuthenticating(true);
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      router.push('/');
    } catch (error) {
      console.error("Error signing in with Google:", error);
      // Handle error (e.g., show a toast message)
    } finally {
      setIsAuthenticating(false);
    }
  };

  const signUpWithEmail = async (email: string, pass: string): Promise<FirebaseUser | null> => {
    setIsAuthenticating(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
      router.push('/');
      return userCredential.user;
    } catch (error) {
      console.error("Error signing up with email:", error);
      throw error; // Re-throw to be caught in the form
    } finally {
      setIsAuthenticating(false);
    }
  };

  const signInWithEmail = async (email: string, pass: string): Promise<FirebaseUser | null> => {
    setIsAuthenticating(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, pass);
      router.push('/');
      return userCredential.user;
    } catch (error) {
      console.error("Error signing in with email:", error);
      throw error; // Re-throw to be caught in the form
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
