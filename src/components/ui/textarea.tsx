import * as React from 'react';
import { cn } from '@/lib/utils';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(({ className, ...props }, ref) => {
  return (
    <textarea
      className={cn('flex min-h-24 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm outline-none ring-0 placeholder:text-slate-400 focus:border-slate-500 dark:border-slate-700 dark:bg-slate-900', className)}
      ref={ref}
      {...props}
    />
  );
});
Textarea.displayName = 'Textarea';

export { Textarea };
