// src/app/profile/page.tsx
'use client';

import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { type ComponentPropsWithoutRef } from 'react';
import { type FieldErrors, type UseFormHandleSubmit, type UseFormRegister } from 'react-hook-form';
import { useProfileForm, type ProfileFormData } from '@/hooks/useProfileForm';
import type { AppUser } from '@/types/user';

type ProfileFormInputProps = {
  id: keyof ProfileFormData;
  label: string;
  register: UseFormRegister<ProfileFormData>;
  errors: FieldErrors<ProfileFormData>;
} & ComponentPropsWithoutRef<'input'>;

const ProfileFormInput = ({ id, label, register, errors, ...props }: ProfileFormInputProps) => (
  <div>
    <Label htmlFor={id}>{label}</Label>
    <Input id={id} {...register(id)} {...props} />
    {errors[id] && <span className="mt-1 text-xs text-red-500">This field is required</span>}
  </div>
);

const ProfileFormTextarea = ({
  id,
  label,
  register,
  errors,
}: {
  id: keyof ProfileFormData;
  label: string;
  register: UseFormRegister<ProfileFormData>;
  errors: FieldErrors<ProfileFormData>;
}) => (
  <div>
    <Label htmlFor={id}>{label}</Label>
    <Textarea id={id} {...register(id)} />
    {errors[id] && <span className="mt-1 text-xs text-red-500">This field is required</span>}
  </div>
);

type ProfileFormBodyProps = {
  handleSubmit: UseFormHandleSubmit<ProfileFormData>;
  onSubmit: (data: ProfileFormData) => void;
  register: UseFormRegister<ProfileFormData>;
  errors: FieldErrors<ProfileFormData>;
  isSaving: boolean;
  photoUrlValue: string;
  user: AppUser | null;
};

const ProfileFormBody = ({
  handleSubmit,
  onSubmit,
  register,
  errors,
  isSaving,
  photoUrlValue,
  user,
}: ProfileFormBodyProps) => (
  <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
    <div className="flex items-center space-x-6">
      <Avatar className="h-24 w-24">
        <AvatarImage src={photoUrlValue || undefined} alt="Avatar Preview" />
        <AvatarFallback>{user?.displayName?.charAt(0)}</AvatarFallback>
      </Avatar>
      <div className="w-full">
        <Label htmlFor="photoURL">Avatar URL</Label>
        <Input id="photoURL" {...register('photoURL')} placeholder="https://example.com/avatar.png" />
      </div>
    </div>
    <ProfileFormInput id="displayName" label="Full Name" register={register} errors={errors} />
    <ProfileFormInput
      id="role"
      label="Role/Title"
      register={register}
      errors={errors}
      placeholder="e.g., Principal Investigator"
    />
    <ProfileFormTextarea id="bio" label="Short Bio" register={register} errors={errors} />
    <ProfileFormInput id="linkedinUrl" label="LinkedIn Profile URL" register={register} errors={errors} />
    <ProfileFormInput id="email" label="Contact Email" register={register} errors={errors} disabled />
    <Button type="submit" disabled={isSaving} className="btn-base btn-primary-dark w-full">
      {isSaving ? 'Saving...' : 'Save Changes'}
    </Button>
  </form>
);

const ProfileFormSkeleton = () => (
  <div className="space-y-4">
    <Skeleton className="h-24 w-24 rounded-full" />
    <Skeleton className="h-10 w-full" />
    <Skeleton className="h-10 w-full" />
    <Skeleton className="h-24 w-full" />
    <Skeleton className="mt-4 h-12 w-full" />
  </div>
);

function ProfileForm() {
  const { user, loading, isSaving, register, handleSubmit, errors, photoUrlValue, onSubmit } = useProfileForm();

  if (loading) {
    return <ProfileFormSkeleton />;
  }

  return (
    <ProfileFormBody
      handleSubmit={handleSubmit}
      onSubmit={onSubmit}
      register={register}
      errors={errors}
      isSaving={isSaving}
      photoUrlValue={photoUrlValue}
      user={user}
    />
  );
}

export default function ProfilePage() {
  return (
    <ProtectedRoute allowedRoles={['researcher', 'admin']}>
      <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6 lg:px-8">
        <h1 className="mb-6 text-3xl font-extrabold">Your Profile</h1>
        <div className="bg-card text-card-foreground rounded-lg p-8 shadow-lg">
          <ProfileForm />
        </div>
      </div>
    </ProtectedRoute>
  );
}
