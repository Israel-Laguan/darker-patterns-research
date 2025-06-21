import type React from 'react';

export type CardMaxWidth = 'sm' | 'md' | 'lg' | 'xl';

export interface AuthCardProps {
  /** Main title of the card */
  title: string;

  /** Optional description text */
  description?: string;

  /** Main content of the card */
  children: React.ReactNode;

  /** Footer content, typically links or additional actions */
  footer?: React.ReactNode;

  /** Optional custom class names */
  className?: string;

  /** Optional logo to display at the top of the card */
  logo?: React.ReactNode | string;

  /** Optional alert message to display above the content */
  alert?: React.ReactNode;

  /** Maximum width of the card */
  maxWidth?: CardMaxWidth;

  /** Whether to show the gradient background */
  showGradient?: boolean;

  /** Whether to apply backdrop blur effect */
  showBlur?: boolean;
}
