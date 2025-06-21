import { FormControl } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import type { PasswordInputProps } from './PasswordInput.types';

export function PasswordInput({ field, className, ...props }: PasswordInputProps) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <FormControl>
      <div className="relative">
        <Input
          type={showPassword ? 'text' : 'password'}
          placeholder="Enter your password"
          value={field.value}
          onChange={field.onChange}
          className={cn(
            'pr-10', // Add padding for the eye icon
            className,
          )}
          {...props}
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className={cn(
            'absolute top-1/2 right-3 -translate-y-1/2',
            'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200',
            'transition-colors duration-200',
            'focus:ring-brand-purple-500 dark:focus:ring-brand-purple-400 focus:ring-2 focus:ring-offset-2 focus:outline-none',
            'rounded-full p-1',
          )}
          aria-label={showPassword ? 'Hide password' : 'Show password'}
        >
          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
    </FormControl>
  );
}
