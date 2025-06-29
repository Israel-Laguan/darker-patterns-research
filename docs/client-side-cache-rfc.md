### **Final Proposal: Functional Client-Side Cache with React & Dexie**

This architecture creates a powerful, client-side caching layer that is resilient, configurable, and easy to use within a React application. It avoids classes entirely, relying on React hooks and closures for a more idiomatic and maintainable solution.

#### **1. Cache Types and Configuration (`types.ts`)**

We will use a five-level Time-to-Live (TTL) strategy to handle different data persistence needs, including a new `CONFIG` level for long-term data like feature flags.

```ts
// src/lib/cache/types.ts

/**
 * Defines the persistence level of a cache entry, determining its TTL.
 */
export enum CacheLevel {
  CRITICAL = 'critical', // Very short-lived data (e.g., live events)
  STANDARD = 'standard', // Regularly updated content (e.g., posts)
  STABLE = 'stable', // Data that changes infrequently (e.g., user profiles)
  PERSISTENT = 'persistent', // Data that rarely changes (e.g., app settings)
  CONFIG = 'config', // Long-term data (e.g., feature flags)
}

/**
 * Maps each cache level to its duration in milliseconds.
 */
export const CACHE_TTL_MAP: Record<CacheLevel, number> = {
  [CacheLevel.CRITICAL]: 1000 * 60 * 5, // 5 minutes
  [CacheLevel.STANDARD]: 1000 * 60 * 30, // 30 minutes
  [CacheLevel.STABLE]: 1000 * 60 * 60 * 4, // 4 hours
  [CacheLevel.PERSISTENT]: 1000 * 60 * 60 * 24, // 24 hours
  [CacheLevel.CONFIG]: 1000 * 60 * 60 * 24 * 7, // 1 week
};

/**
 * Represents the structure of an entry in the IndexedDB cache.
 */
export interface CacheEntry<T = any> {
  key: string;
  data: T;
  createdAt: number;
  expiresAt: number;
  level: CacheLevel;
}
```

#### **2. Cache Key Utility (`utils.ts`)**

To ensure consistent and collision-free cache keys, especially for hierarchical data, we will re-introduce the `createCacheKey` utility.

```ts
// src/lib/cache/utils.ts

/**
 * Creates a standardized cache key from a prefix and parts.
 * Example: createCacheKey('user', '123', 'profile') => "user:123:profile"
 * @param prefix A string to namespace the key (e.g., 'posts', 'user-settings').
 * @param parts The remaining parts of the key.
 * @returns A formatted string key.
 */
export function createCacheKey(prefix: string, ...parts: (string | number)[]): string {
  return `${prefix}:${parts.join(':')}`;
}
```

#### **3. The Core: `CacheContext.tsx`**

This is the heart of the system. It initializes the Dexie database, manages its lifecycle, handles automatic cleanup, and provides the core caching functions through a React Context. It is now configurable and includes more robust error handling and granular cleanup.

```tsx
// src/contexts/CacheContext.tsx
'use client';

import React, { createContext, useContext, useRef, useState, useEffect, ReactNode, useMemo } from 'react';
import Dexie from 'dexie';
import { CacheLevel, CacheEntry, CACHE_TTL_MAP } from '@/lib/cache/types';

// Define the shape of the context value
interface CacheContextValue {
  set: <T>(key: string, data: T, level?: CacheLevel, customTtlMs?: number) => Promise<void>;
  get: <T>(key: string) => Promise<T | null>;
  invalidateByPattern: (pattern: string) => Promise<void>;
  cleanupExpired: () => Promise<void>;
  cleanupByLevel: (level: CacheLevel) => Promise<void>;
  isReady: boolean;
  error: Error | null;
}

const CacheContext = createContext<CacheContextValue | null>(null);

interface CacheProviderProps {
  children: ReactNode;
  dbName?: string;
  cleanupIntervalMs?: number;
}

/**
 * Provides a client-side caching system to its children.
 */
export function CacheProvider({
  children,
  dbName = 'AppCacheDB',
  cleanupIntervalMs = 1000 * 60 * 10, // Default: 10 minutes
}: CacheProviderProps) {
  // Use a ref to hold the Dexie instance, preventing re-initialization on re-renders
  const dbRef = useRef<Dexie>();
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Centralized error handler
  const handleCacheError = (context: string, error: unknown) => {
    const err = error instanceof Error ? error : new Error(String(error));
    console.error(`[CacheProvider Error: ${context}]`, err);
    setError(err); // Expose the error state
  };

  // Effect for initializing the database
  useEffect(() => {
    const db = new Dexie(dbName);
    db.version(1).stores({
      cache: '&key, expiresAt, level, createdAt', // Compound index on [level, expiresAt] is not needed for these queries
    });

    db.open()
      .then(() => {
        dbRef.current = db;
        // Perform an initial cleanup on load
        return db.table<CacheEntry>('cache').where('expiresAt').belowOrEqual(Date.now()).delete();
      })
      .then(() => setIsReady(true))
      .catch(e => handleCacheError('Initialization', e));

    // Dexie doesn't require an explicit close in this setup
  }, [dbName]);

  // Effect for setting up automatic cleanup
  useEffect(() => {
    if (!isReady) return;

    const performCleanup = () => {
      dbRef.current?.table<CacheEntry>('cache').where('expiresAt').belowOrEqual(Date.now()).delete()
        .catch(e => handleCacheError('Auto Cleanup', e));
    };

    window.addEventListener('focus', performCleanup);
    const intervalId = setInterval(performCleanup, cleanupIntervalMs);

    return () => {
      window.removeEventListener('focus', performCleanup);
      clearInterval(intervalId);
    };
  }, [isReady, cleanupIntervalMs]);

  // Memoize the context value to prevent unnecessary re-renders in consumers
  const contextValue: CacheContextValue = useMemo(() => ({
    isReady,
    error,
    set: async <T>(key: string, data: T, level: CacheLevel = CacheLevel.STANDARD, customTtlMs?: number) => {
      if (!dbRef.current) return;
      const now = Date.now();
      const ttl = customTtlMs ?? CACHE_TTL_MAP[level];
      const entry: CacheEntry<T> = { key, data, createdAt: now, expiresAt: now + ttl, level };
      await dbRef.current.table<CacheEntry>('cache').put(entry);
    },
    get: async <T>(key: string): Promise<T | null> => {
      try {
        if (!dbRef.current) return null;
        const record = await dbRef.current.table<CacheEntry>('cache').get(key);
        if (!record) return null;

        if (record.expiresAt <= Date.now()) {
          // Entry is expired, delete it and return null
          await dbRef.current.table('cache').delete(key);
          return null;
        }
        return record.data as T;
      } catch (e) {
        handleCacheError(`get: ${key}`, e);
        return null; // On error, return null to allow fallback to fetcher
      }
    },
    invalidateByPattern: async (pattern: string) => {
        if (!dbRef.current) return;
        const regex = new RegExp(`^${pattern.replace(/\*/g, '.*')}$`);
        const allEntries = await dbRef.current.table<CacheEntry>('cache').toArray();
        const keysToDelete = allEntries.filter(entry => regex.test(entry.key)).map(entry => entry.key);
        if (keysToDelete.length > 0) {
            await dbRef.current.table('cache').bulkDelete(keysToDelete);
        }
    },
    cleanupExpired: async () => {
        if (!dbRef.current) return;
        await dbRef.current.table<CacheEntry>('cache').where('expiresAt').belowOrEqual(Date.now()).delete();
    },
    cleanupByLevel: async (level: CacheLevel) => {
        if (!dbRef.current) return;
        const now = Date.now();
        await dbRef.current.table<CacheEntry>('cache')
            .where('level').equals(level)
            .and(entry => entry.expiresAt <= now)
            .delete();
    },
  }), [isReady, error]);

  return <CacheContext.Provider value={contextValue}>{children}</CacheContext.Provider>;
}

/**
 * Custom hook to access the raw cache context.
 * Useful for direct operations like invalidation.
 */
export function useCache(): CacheContextValue {
  const context = useContext(CacheContext);
  if (!context) {
    throw new Error('useCache must be used within a CacheProvider');
  }
  return context;
}
```

#### **4. The Data-Fetching Hook: `useAsyncCache.ts`**

This hook abstracts the entire "check cache -> fetch if needed -> update cache" logic. It now uses the `createCacheKey` utility and exposes loading and error states for a better UI integration.

```ts
// src/hooks/useAsyncCache.ts
import { useState, useEffect, useCallback } from 'react';
import { useCache } from '@/contexts/CacheContext';
import { createCacheKey } from '@/lib/cache/utils';
import { CacheLevel } from '@/lib/cache/types';

interface UseAsyncCacheOptions {
  refetchOnMount?: boolean;
  enabled?: boolean;
  customTtl?: number;
}

/**
 * A hook to fetch data, transparently using a client-side cache.
 * Manages loading, error, and data states for you.
 */
export function useAsyncCache<T>(
  keyParts: (string | number)[],
  fetcher: () => Promise<T>,
  level: CacheLevel = CacheLevel.STANDARD,
  options: UseAsyncCacheOptions = {},
) {
  const { refetchOnMount = false, enabled = true, customTtl } = options;
  const { get, set, isReady } = useCache();

  // Generate a stable cache key
  const cacheKey = createCacheKey('async-data', ...keyParts);

  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState<Error | null>(null);

  const loadData = useCallback(
    async (forceRefresh = false) => {
      if (!isReady || !enabled) {
        if (!enabled) setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        // Try fetching from cache first unless a refresh is forced
        if (!forceRefresh) {
          const cachedData = await get<T>(cacheKey);
          if (cachedData !== null) {
            setData(cachedData);
            setLoading(false);
            return;
          }
        }

        // If not in cache or refresh is forced, call the fetcher
        const freshData = await fetcher();
        await set(cacheKey, freshData, level, customTtl);
        setData(freshData);
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Failed to fetch data');
        setError(error);
        console.error(`[useAsyncCache Error: ${cacheKey}]`, error);
      } finally {
        setLoading(false);
      }
    },
    [cacheKey, get, set, fetcher, level, customTtl, isReady, enabled],
  );

  // Effect to trigger the initial data load
  useEffect(() => {
    if (enabled && (data === null || refetchOnMount)) {
      loadData();
    }
  }, [loadData, enabled, refetchOnMount]);

  // Public refresh function
  const refresh = useCallback(() => loadData(true), [loadData]);

  return { data, loading, error, refresh, isReady };
}
```

#### **5. Usage Example with Server Actions and Invalidation**

This example demonstrates using the hook with a Next.js Server Action and programmatically invalidating the cache after a mutation.

**Server Action:**

```ts
// src/app/actions/posts.ts
'use server';
// ... imports for your database
export async function getPublishedPosts() {
  // Your database logic to fetch posts...
  console.log('Fetching fresh posts from server...');
  return [{ id: 1, title: 'My First Post' }];
}
export async function createPost(title: string) {
  // Your database logic to create a post...
  console.log(`Creating post: ${title}`);
  return { id: 2, title };
}
```

**Component:**

```tsx
// src/components/PostsList.tsx
'use client';

import { useAsyncCache } from '@/hooks/useAsyncCache';
import { useCache } from '@/contexts/CacheContext';
import { getPublishedPosts, createPost } from '@/app/actions/posts';
import { CacheLevel } from '@/lib/cache/types';

function PostsList() {
  const { invalidateByPattern } = useCache();
  const {
    data: posts,
    loading,
    error,
    refresh,
  } = useAsyncCache(
    ['posts', 'published'], // Hierarchical key
    getPublishedPosts,
    CacheLevel.STANDARD,
  );

  const handleCreatePost = async () => {
    try {
      await createPost('My New Post!');
      // Invalidate all caches related to posts after creation
      await invalidateByPattern('async-data:posts*');
      // The `refresh` function is implicitly called by the invalidation,
      // but calling it explicitly ensures the UI updates immediately.
      await refresh();
    } catch (err) {
      console.error('Failed to create post', err);
    }
  };

  if (loading && !posts) return <div>Loading posts...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      <button onClick={handleCreatePost}>Create New Post</button>
      <button onClick={refresh}>Refresh Posts</button>
      <ul>{posts?.map((post) => <li key={post.id}>{post.title}</li>)}</ul>
    </div>
  );
}
```

### **Advanced Implementation and Usage Guide: Functional Client-Side Cache**

This document extends the core proposal with advanced features, including user-facing cache management, batch operations, and integration guides for various React frameworks.

#### **1. User-Managed Cache Settings**

To empower developers, QA testers, or even power users, you can create a component that provides direct control over the cache. This is invaluable for debugging, testing server-side changes, or clearing corrupted data without manual intervention in browser developer tools.

This component uses the `useCache` hook to access the raw cache control functions like `invalidateByPattern` and `cleanupExpired`.

**Example Component: `<CacheAdminPanel />`**

```tsx
// src/components/CacheAdminPanel.tsx
'use client';

import React, { useState } from 'react';
import { useCache } from '@/contexts/CacheContext';

export function CacheAdminPanel() {
  const { invalidateByPattern, cleanupExpired, isReady } = useCache();
  const [statusMessage, setStatusMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleAction = async (action: () => Promise<void>, successMessage: string) => {
    if (!isReady) return;
    setIsLoading(true);
    setStatusMessage('');
    try {
      await action();
      setStatusMessage(successMessage);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
      setStatusMessage(`Error: ${errorMessage}`);
    } finally {
      setIsLoading(false);
      setTimeout(() => setStatusMessage(''), 3000); // Clear message after 3 seconds
    }
  };

  const invalidatePosts = () =>
    handleAction(() => invalidateByPattern('async-data:posts*'), 'Successfully invalidated all post-related cache.');

  const invalidateUserSettings = () =>
    handleAction(
      () => invalidateByPattern('async-data:user-settings*'),
      'Successfully invalidated user settings cache.',
    );

  const clearAllExpired = () => handleAction(() => cleanupExpired(), 'Successfully cleared all expired cache entries.');

  return (
    <div className="rounded-lg border bg-gray-50 p-4">
      <h3 className="mb-3 text-lg font-semibold">Cache Management</h3>
      <div className="flex flex-wrap gap-2">
        <button
          onClick={invalidatePosts}
          disabled={isLoading || !isReady}
          className="rounded bg-blue-600 px-3 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-50"
        >
          Invalidate Posts Cache
        </button>
        <button
          onClick={invalidateUserSettings}
          disabled={isLoading || !isReady}
          className="rounded bg-purple-600 px-3 py-2 text-sm text-white hover:bg-purple-700 disabled:opacity-50"
        >
          Invalidate Settings Cache
        </button>
        <button
          onClick={clearAllExpired}
          disabled={isLoading || !isReady}
          className="rounded bg-red-600 px-3 py-2 text-sm text-white hover:bg-red-700 disabled:opacity-50"
        >
          Clear All Expired
        </button>
      </div>
      {statusMessage && <p className="mt-3 text-sm text-gray-700">{statusMessage}</p>}
      {!isReady && <p className="mt-3 text-sm text-yellow-700">Cache system is not ready.</p>}
    </div>
  );
}
```

#### **2. Batch Cache Operations**

When you need to cache multiple items at once (e.g., after a bulk API fetch), performing operations in a batch is far more efficient. We can create a utility function for this purpose.

```ts
// src/lib/cache/utils.ts

import { CacheLevel } from './types';
import { createCacheKey } from './utils'; // Assuming createCacheKey is in the same file or imported

/**
 * Stores multiple items in the cache in a single, efficient operation.
 *
 * @param cacheSet The `set` function from the `useCache` hook.
 * @param items An array of items to cache.
 */
export async function batchCacheSet<T>(
  cacheSet: (key: string, data: T, level?: CacheLevel, customTtl?: number) => Promise<void>,
  items: Array<{
    keyParts: (string | number)[];
    data: T;
    level?: CacheLevel;
    customTtl?: number;
  }>,
): Promise<void> {
  await Promise.all(
    items.map((item) => {
      // Re-use the key creation logic for consistency
      const key = createCacheKey('async-data', ...item.keyParts);
      return cacheSet(key, item.data, item.level, item.customTtl);
    }),
  );
}
```

#### **3. Example: Fetching from a Third-Party API**

The `useAsyncCache` hook is fetch-agnostic, meaning it can wrap any Promise-based function, including native `fetch` calls to third-party APIs.

**Component to fetch and cache data from JSONPlaceholder:**

```tsx
// src/components/TodosList.tsx
'use client';

import { useAsyncCache } from '@/hooks/useAsyncCache';
import { CacheLevel } from '@/lib/cache/types';

interface Todo {
  userId: number;
  id: number;
  title: string;
  completed: boolean;
}

// The fetcher function is a simple async function returning a Promise
async function fetchTodos(): Promise<Todo[]> {
  const response = await fetch('https://jsonplaceholder.typicode.com/todos?_limit=10');
  if (!response.ok) {
    throw new Error('Failed to fetch todos.');
  }
  return response.json();
}

export function TodosList() {
  const {
    data: todos,
    loading,
    error,
    refresh,
  } = useAsyncCache<Todo[]>(
    ['external-todos'], // Cache key
    fetchTodos,
    CacheLevel.STABLE, // Cache for 4 hours
    { refetchOnMount: false },
  );

  if (loading) return <div>Loading todos...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div className="rounded-lg border p-4">
      <h3 className="mb-3 text-lg font-semibold">Todos from API</h3>
      <button onClick={refresh} className="mb-4 rounded bg-gray-200 px-3 py-1">
        Refresh
      </button>
      <ul className="list-disc pl-5">
        {todos?.map((todo) => (
          <li key={todo.id} className={todo.completed ? 'text-gray-500 line-through' : ''}>
            {todo.title}
          </li>
        ))}
      </ul>
    </div>
  );
}
```

#### **4. Root Layout Setup (Integration Guide)**

The `CacheProvider` must be placed at the root of your application so that all components have access to the cache context.

##### **For Next.js 15 (App Router)**

In the Next.js App Router, the ideal place is the root `layout.tsx` file. Remember to mark it as a Client Component (`'use client'`) because the provider manages state and side effects.

```tsx
// src/app/layout.tsx
'use client';

import { CacheProvider } from '@/contexts/CacheContext';
import './globals.css';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {/* Wrap the entire application with the CacheProvider */}
        <CacheProvider
          dbName="MyWebAppCache"
          cleanupIntervalMs={1000 * 60 * 5} // Optional: Run cleanup every 5 minutes
        >
          <main>{children}</main>
        </CacheProvider>
      </body>
    </html>
  );
}
```

#### **5. Dependencies and Project Structure**

##### **Dependencies**

The primary dependency is `dexie`. The others are standard for a React/Next.js project.

```json
{
  "dependencies": {
    "dexie": "^4.0.7",
    "next": "15.x.x",
    "react": "19.x.x",
    "react-dom": "19.x.x"
  },
  "devDependencies": {
    "@types/node": "^20.x.x",
    "@types/react": "^18.x.x",
    "@types/react-dom": "^18.x.x",
    "typescript": "^5.x.x"
  }
}
```

To install:
`npm install dexie`

##### **Recommended File Structure**

This structure organizes the caching logic cleanly, separating types, hooks, context, and utilities.

```
src/
\u251c\u2500\u2500 app/
\u2502   \u251c\u2500\u2500 layout.tsx              # Root layout (for Next.js) with CacheProvider
\u2502   \u2514\u2500\u2500 page.tsx                # Example page using cached components
\u2502   \u2514\u2500\u2500 actions/
\u2502       \u2514\u2500\u2500 posts.ts            # Server Actions
\u251c\u2500\u2500 components/
\u2502   \u251c\u2500\u2500 PostsList.tsx           # Component using useAsyncCache with Server Actions
\u2502   \u251c\u2500\u2500 TodosList.tsx           # Component using useAsyncCache with 3rd party API
\u2502   \u2514\u2500\u2500 CacheAdminPanel.tsx     # Component for manual cache management
\u251c\u2500\u2500 contexts/
\u2502   \u2514\u2500\u2500 CacheContext.tsx        # The core CacheProvider and useCache hook
\u251c\u2500\u2500 hooks/
\u2502   \u2514\u2500\u2500 useAsyncCache.ts        # The main data-fetching hook
\u251c\u2500\u2500 lib/
\u2502   \u251c\u2500\u2500 cache/
\u2502   \u2502   \u251c\u2500\u2500 types.ts            # All TypeScript types and enums for the cache
\u2502   \u2502   \u2514\u2500\u2500 utils.ts            # Utility functions (createCacheKey, batchCacheSet)
\u2502   \u2514\u2500\u2500 db/
\u2502       \u2514\u2500\u2500 ...                 # Your server-side database logic
\u2514\u2500\u2500 index.css                   # Or globals.css
\u2514\u2500\u2500 main.jsx                    # Root entry point (for CSR apps)
```
