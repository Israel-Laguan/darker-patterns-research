'use client';

import { auth, db } from '@/lib/firebase';
import { fetchOrCreateUserProfile } from '@/lib/firestore/queries/users';
import type { AppUser } from '@/types/user';
import type { User as FirebaseUser } from 'firebase/auth';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import type { ReactNode } from 'react';
import { createContext, useEffect, useState } from 'react';

interface AuthContextType {
  user: AppUser | null; // Unified user object
  isAdmin: boolean;
  isResearcher: boolean;
  loading: boolean;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

function getRoleFlags(roles: string[] | undefined) {
  const isAdmin = !!roles?.includes('admin');
  const isResearcher = !!roles?.includes('researcher') || isAdmin;
  return { isAdmin, isResearcher };
}

async function handleAuthState(
  firebaseUser: FirebaseUser | null,
  setUser: (u: AppUser | null) => void,
  setIsAdmin: (b: boolean) => void,
  setIsResearcher: (b: boolean) => void,
  setLoading: (b: boolean) => void,
) {
  setLoading(true);
  if (firebaseUser) {
    try {
      const appUser = await fetchOrCreateUserProfile(firebaseUser);
      setUser(appUser);
      const { isAdmin, isResearcher } = getRoleFlags(appUser.roles);
      setIsAdmin(isAdmin);
      setIsResearcher(isResearcher);
    } catch (fetchError) {
      console.error('Error fetching/creating user profile:', fetchError);
      setUser(null);
      setIsAdmin(false);
      setIsResearcher(false);
    }
  } else {
    setUser(null);
    setIsAdmin(false);
    setIsResearcher(false);
  }
  setLoading(false);
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [isResearcher, setIsResearcher] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth || !db) {
      console.warn('AuthContext: Firebase auth or db is not initialized.');

      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) =>
      handleAuthState(firebaseUser, setUser, setIsAdmin, setIsResearcher, setLoading),
    );

    return () => unsubscribe();
  }, []);

  const logout = async () => {
    if (auth) {
      await signOut(auth);
    } else {
      console.warn('AuthContext: Firebase auth is not initialized. Cannot logout.');
    }
  };

  const value = { user, isAdmin, isResearcher, loading, logout };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
