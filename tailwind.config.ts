import type { Config } from 'tailwindcss';

export default {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        border:    '#E9ECF5',
        card:      '#FFFFFF',
        text:      '#1E293B',
        heading:   '#0F172A',
        muted:     '#64748B',
        subtle:    '#94A3B8',
        bg:        '#F8F9FC',
      },
      borderRadius: {
        card:  '20px',
        btn:   '14px',
        input: '14px',
      },
      boxShadow: {
        card:       '0px 4px 24px rgba(15, 23, 42, 0.04)',
        'card-hover': '0px 8px 32px rgba(15, 23, 42, 0.09)',
        popover:    '0px 8px 40px rgba(15, 23, 42, 0.12)',
      },
      width: {
        sidebar: '280px',
      },
      spacing: {
        sidebar: '280px',
        navbar:  '80px',
        content: '24px',
      },
      animation: {
        'fade-in':  'fadeIn 0.25s ease-out',
        'fade-up':  'fadeUp 0.3s ease-out',
        'slide-in': 'slideIn 0.25s ease-out',
      },
      keyframes: {
        fadeIn:  { '0%': { opacity: '0' },                              '100%': { opacity: '1' } },
        fadeUp:  { '0%': { opacity: '0', transform: 'translateY(12px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
        slideIn: { '0%': { opacity: '0', transform: 'translateX(-10px)' }, '100%': { opacity: '1', transform: 'translateX(0)' } },
      },
    },
  },
  plugins: [],
} satisfies Config;
