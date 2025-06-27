// src/hooks/useProfileForm.ts
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { getAuth, updateProfile } from 'firebase/auth';
import { useAuth } from '@/hooks/useAuth';
import { fetchOrCreateUserProfile } from '@/lib/firestore/queries/users';
import { updateUserProfile } from '@/lib/firestore/mutations/users';
import type { UserProfileUpdateData } from '@/types/user';

// Define a type for our form data to ensure type safety
export interface ProfileFormData {
  displayName: string;
  photoURL: string;
  role: string;
  bio: string;
  linkedinUrl: string;
  email: string; // read-only
}

async function handleProfileUpdate(
  data: ProfileFormData,
  refreshUser: () => Promise<void>,
  setIsSaving: (isSaving: boolean) => void,
) {
  const auth = getAuth();
  const currentUser = auth.currentUser;

  if (!currentUser) {
    toast.error('User not authenticated. Please sign in again.');
    return;
  }

  setIsSaving(true);
  try {
    await updateProfile(currentUser, {
      displayName: data.displayName,
      photoURL: data.photoURL,
    });

    const firestoreUpdateData: UserProfileUpdateData = {
      displayName: data.displayName,
      photoURL: data.photoURL,
      role: data.role,
      bio: data.bio,
      linkedinUrl: data.linkedinUrl,
    };

    await updateUserProfile(currentUser.uid, firestoreUpdateData);
    await refreshUser();
    toast.success('Profile updated!');
  } catch (error) {
    console.error('Update failed:', error);
    toast.error('Failed to update profile');
  } finally {
    setIsSaving(false);
  }
}

export function useProfileForm() {
  const { user, loading: authLoading, refreshUser } = useAuth();
  const [isSaving, setIsSaving] = useState(false);
  const [fetching, setFetching] = useState(true);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
    watch,
  } = useForm<ProfileFormData>({
    defaultValues: {
      displayName: '',
      photoURL: '',
      role: '',
      bio: '',
      linkedinUrl: '',
      email: '',
    },
  });

  const photoUrlValue = watch('photoURL');

  useEffect(() => {
    if (user) {
      fetchOrCreateUserProfile(user)
        .then((profile) => {
          reset({
            displayName: profile.displayName || '',
            photoURL: profile.photoURL || '',
            role: profile.role || '',
            bio: profile.bio || '',
            linkedinUrl: profile.linkedinUrl || '',
            email: profile.email || '',
          });
        })
        .catch(() => toast.error('Failed to fetch profile'))
        .finally(() => setFetching(false));
    } else if (!authLoading) {
      setFetching(false);
    }
  }, [user, authLoading, reset]);

  const onSubmit = useCallback(
    (data: ProfileFormData) => {
      handleProfileUpdate(data, refreshUser, setIsSaving);
    },
    [refreshUser],
  );

  return {
    user,
    loading: authLoading || fetching,
    isSaving,
    register,
    handleSubmit,
    errors,
    photoUrlValue,
    onSubmit,
  };
}
