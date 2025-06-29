// src/contexts/CacheContext.tsx
'use client';

import React, { createContext, useContext } from 'react';

import { useCacheDatabase } from '@/hooks/useCacheDatabase';
import { CacheContextValue } from '@/lib/cache/types';

// 1. Context Definition
export const CacheContext = createContext<CacheContextValue | undefined>(undefined);

// 2. Provider Component
interface CacheProviderProps {
  children: React.ReactNode;
  dbName?: string;
  cleanupIntervalMs?: number;
}

export function CacheProvider({ children, ...props }: CacheProviderProps) {
  const cache = useCacheDatabase(props);

  return <CacheContext.Provider value={cache}>{children}</CacheContext.Provider>;
}

export function useCache() {
  const context = useContext(CacheContext);
  if (!context) {
    throw new Error('useCache must be used within a CacheProvider');
  }
  return context;
}
