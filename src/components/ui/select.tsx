import * as React from 'react';
import { cn } from '@/lib/utils';

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  placeholder?: string;
}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, children, placeholder, ...props }, ref) => {
    return (
      <select
        className={cn(
          'flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm outline-none ring-0 focus:border-slate-500 dark:border-slate-700 dark:bg-slate-900',
          className
        )}
        ref={ref}
        {...props}
      >
        {placeholder && <option value="" disabled>{placeholder}</option>}
        {children}
      </select>
    );
  }
);
Select.displayName = 'Select';

export { Select };