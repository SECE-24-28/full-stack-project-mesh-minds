'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import { Toaster } from 'sonner';

export function useTheme() {
  return { theme: 'light' as const, toggle: () => {} };
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <Toaster
        position="top-right"
        richColors
        toastOptions={{
          style: {
            borderRadius: '14px',
            fontSize: '14px',
            border: '1px solid #E9ECF5',
            boxShadow: '0px 4px 24px rgba(15, 23, 42, 0.08)',
          },
        }}
      />
    </QueryClientProvider>
  );
}
