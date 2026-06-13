import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-[14px] text-sm font-semibold transition-all focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default:   'bg-[var(--role-accent,#6366F1)] text-white shadow-[0_2px_12px_var(--role-glow,rgba(99,102,241,0.25))] hover:scale-[1.02] hover:opacity-90',
        secondary: 'bg-white text-[#334155] border border-[#E9ECF5] hover:bg-[var(--role-soft,#EDEDFF)] hover:border-[var(--role-secondary,#B5BAFF)]',
        outline:   'border border-[#E2E8F0] bg-white text-[#334155] hover:bg-[#F8F9FC]',
        ghost:     'text-[#334155] hover:bg-[var(--role-soft,#F8F9FC)]',
        danger:    'bg-red-50 text-red-600 border border-red-100 hover:bg-red-100',
      },
      size: {
        default: 'h-11 px-5 py-2',
        sm:      'h-9 px-4 text-xs',
        lg:      'h-12 px-7 text-base',
      },
    },
    defaultVariants: { variant: 'default', size: 'default' },
  },
);

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(({ className, variant, size, ...props }, ref) => {
  return <button className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
});
Button.displayName = 'Button';

export { Button, buttonVariants };
