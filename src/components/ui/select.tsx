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
          'flex h-12 w-full rounded-[14px] border border-[#E2E8F0] bg-white px-4 py-2 text-sm text-[#0F172A] shadow-none outline-none transition-all focus:border-[var(--role-primary,#9FA1FF)] focus:ring-3 focus:ring-[var(--role-glow,rgba(99,102,241,0.18))] disabled:cursor-not-allowed disabled:opacity-50',
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
