import { Button } from '@/components/ui/button';
import { AuthCard } from '@/components/auth/AuthCard';
import type { LoginViewProps } from './LoginView.types';
import { AlertTriangle, User } from 'lucide-react';
import Link from 'next/link';
import { LoginForm } from './LoginForm';

export function LoginView({
  form,
  onSubmit,
  showPassword,
  setShowPassword,
  isSubmitting,
  error,
  displayReason,
}: LoginViewProps) {
  const footer = (
    <div className="flex flex-col items-center space-y-2">
      <Button variant="link" className="text-dark-text-secondary hover:text-dark-text-primary h-auto text-sm" asChild>
        <Link href="/forgot-password">Forgot your password? Contact an administrator</Link>
      </Button>
    </div>
  );

  return (
    <AuthCard
      title="Sign In"
      description="Enter your credentials to access your account"
      logo={<User className="text-brand-purple-500 mx-auto h-10 w-10" />}
      alert={
        displayReason && (
          <div className="flex items-center gap-2">
            <AlertTriangle size={20} />
            <p>{displayReason}</p>
          </div>
        )
      }
      footer={footer}
      maxWidth="sm"
    >
      <LoginForm
        form={form}
        onSubmit={onSubmit}
        showPassword={showPassword}
        setShowPassword={setShowPassword}
        isSubmitting={isSubmitting}
        error={error}
      />
    </AuthCard>
  );
}
