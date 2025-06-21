import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { AuthCardProps } from './AuthCard.types';
import { AlertTriangle } from 'lucide-react';
import Image from 'next/image';

export function AuthCard({
  title,
  description,
  children,
  footer,
  className,
  logo,
  alert,
  maxWidth = 'sm',
  showGradient = true,
  showBlur = true,
}: AuthCardProps) {
  return (
    <div
      className={cn(
        'flex min-h-screen items-center justify-center p-4',
        showGradient && 'from-dark-bg-primary bg-gradient-to-br to-[#1c162e]',
        className,
      )}
    >
      <Card
        className={cn(
          'w-full shadow-2xl',
          'bg-dark-bg-secondary/90 border-dark-bg-tertiary/50',
          showBlur && 'backdrop-blur-sm',
          maxWidth === 'sm' && 'max-w-sm',
          maxWidth === 'md' && 'max-w-md',
          maxWidth === 'lg' && 'max-w-lg',
          maxWidth === 'xl' && 'max-w-xl',
        )}
      >
        <CardHeader className="space-y-4 text-center">
          {logo && (
            <div className="mx-auto">
              {typeof logo === 'string' ? (
                <div className="relative mx-auto h-10 w-10">
                  <Image src={logo} alt="Logo" fill sizes="40px" className="object-contain" />
                </div>
              ) : (
                <div className="mx-auto">{logo}</div>
              )}
            </div>
          )}
          <div>
            <CardTitle className="font-heading-display text-dark-text-primary text-2xl font-bold tracking-tight sm:text-3xl">
              {title}
            </CardTitle>
            {description && <CardDescription className="text-dark-text-secondary mt-2">{description}</CardDescription>}
          </div>
        </CardHeader>

        {alert && (
          <div className="mx-6 mb-4 flex items-center gap-2 rounded-md border border-yellow-500/30 bg-yellow-500/10 px-4 py-3 text-sm text-yellow-300">
            <AlertTriangle size={20} />
            <p>{alert}</p>
          </div>
        )}

        <CardContent className="space-y-4">{children}</CardContent>

        {footer && (
          <CardFooter className="text-dark-text-secondary flex flex-col space-y-2 text-center text-sm">
            {footer}
          </CardFooter>
        )}
      </Card>
    </div>
  );
}
