import type { InputHTMLAttributes } from 'react';

export interface PasswordInputProps extends InputHTMLAttributes<HTMLInputElement> {
  field: {
    value: string;
    onChange: (value: React.ChangeEvent<HTMLInputElement>) => void;
  };
  className?: string;
}
