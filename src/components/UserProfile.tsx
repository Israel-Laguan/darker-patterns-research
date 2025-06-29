// src/components/UserProfile.tsx
'use client';

import React from 'react';
import { useAsyncCache } from '@/hooks/useAsyncCache';
import { UserProfile as UserProfileType } from '@/lib/firestore/queries/users';

interface UserProfileProps {
  userId: string;
}

export function UserProfile({ userId }: UserProfileProps) {
  const {
    data: user,
    loading,
    error,
  } = useAsyncCache<UserProfileType | null, [string]>({
    queryName: 'userProfile',
    params: [userId],
    enabled: !!userId, // Only fetch if userId is provided
  });

  if (loading) {
    return <div>Loading profile...</div>;
  }

  if (error) {
    return <div style={{ color: 'red' }}>Error: {error.message}</div>;
  }

  if (!user) {
    return <div>User not found.</div>;
  }

  return (
    <div>
      <h2>User Profile</h2>
      <p>
        <strong>ID:</strong> {userId}
      </p>
      <p>
        <strong>Display Name:</strong> {user.displayName}
      </p>
      <p>
        <strong>Email:</strong> {user.email}
      </p>
      <p>
        <strong>Role:</strong> {user.roles?.join(', ')}
      </p>
    </div>
  );
}
