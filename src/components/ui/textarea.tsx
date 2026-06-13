import * as React from 'react';
import { cn } from '@/lib/utils';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(({ className, ...props }, ref) => {
  return (
    <textarea
      className={cn(
        'flex min-h-24 w-full rounded-[14px] border border-[#E2E8F0] bg-white px-4 py-3 text-sm text-[#0F172A] shadow-none outline-none placeholder:text-[#94A3B8] transition-all focus:border-[var(--role-primary,#9FA1FF)] focus:ring-3 focus:ring-[var(--role-glow,rgba(99,102,241,0.18))] disabled:cursor-not-allowed disabled:opacity-50',
        className
      )}
      ref={ref}
      {...props}
    />
  );
});
Textarea.displayName = 'Textarea';

export { Textarea };
