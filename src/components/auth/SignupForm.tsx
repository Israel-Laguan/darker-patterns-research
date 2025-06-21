'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { ShieldUserIcon, UserPlus } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import { AuthCard } from '@/components/auth/AuthCard';
import { Button } from '@/components/ui/button';
import { LoadingScreen } from '@/components/ui/loading';
import { useAuth } from '@/hooks/useAuth';
import { createUserAccount, getFirebaseErrorMessage } from '@/lib/auth/signup';
import { signupSchema, type SignupFormValues } from '@/lib/validations/signup';
import { SignupFormFields } from './SignupFormFields';

export function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      displayName: '',
      email: '',
      password: '',
      isResearcher: false,
    },
  });

  if (loading) {
    return <LoadingScreen />;
  }

  if (user) {
    const redirectUrl = searchParams.get('redirect') || '/admin';
    router.push(redirectUrl);
    return null;
  }

  const onSubmit = async (data: SignupFormValues) => {
    setIsSubmitting(true);
    try {
      await createUserAccount(data);
      toast.success('Account created successfully! Please log in.');
      router.push('/login');
    } catch (error: unknown) {
      console.error('Signup error:', error);
      toast.error(getFirebaseErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  const footer = (
    <p>
      Already have an account?{' '}
      <Link href="/login" className="text-primary font-semibold hover:underline">
        Sign in
      </Link>
    </p>
  );

  return (
    <AuthCard
      title="Create Account"
      description="Join us to start validating dark patterns."
      logo={<ShieldUserIcon className="text-brand-purple-500 mx-auto h-10 w-10" />}
      footer={footer}
      maxWidth="sm"
    >
      <div className="space-y-6 transition-colors duration-200">
        <SignupFormFields form={form} onSubmit={onSubmit} />
        <Button
          type="submit"
          onClick={form.handleSubmit(onSubmit)}
          className="btn-base btn-primary-dark w-full justify-center"
          disabled={isSubmitting}
        >
          <UserPlus className="mr-2 h-4 w-4 text-current" />
          {isSubmitting ? 'Creating Account...' : 'Create Account'}
        </Button>
      </div>
    </AuthCard>
  );
}
