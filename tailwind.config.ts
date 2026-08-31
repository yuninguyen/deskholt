import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ['selector', '[data-theme="dark"]'],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        admin: {
          background: 'hsl(var(--background) / <alpha-value>)',
          foreground: 'hsl(var(--foreground) / <alpha-value>)',
          card: 'hsl(var(--card) / <alpha-value>)',
          'card-foreground': 'hsl(var(--card-foreground) / <alpha-value>)',
          popover: 'hsl(var(--popover) / <alpha-value>)',
          'popover-foreground': 'hsl(var(--popover-foreground) / <alpha-value>)',
          primary: 'hsl(var(--primary) / <alpha-value>)',
          'primary-foreground': 'hsl(var(--primary-foreground) / <alpha-value>)',
          secondary: 'hsl(var(--secondary) / <alpha-value>)',
          'secondary-foreground': 'hsl(var(--secondary-foreground) / <alpha-value>)',
          muted: 'hsl(var(--muted) / <alpha-value>)',
          'muted-foreground': 'hsl(var(--muted-foreground) / <alpha-value>)',
          accent: 'hsl(var(--accent) / <alpha-value>)',
          'accent-foreground': 'hsl(var(--accent-foreground) / <alpha-value>)',
          destructive: 'hsl(var(--destructive) / <alpha-value>)',
          border: 'hsl(var(--border) / <alpha-value>)',
          input: 'hsl(var(--input) / <alpha-value>)',
          ring: 'hsl(var(--ring) / <alpha-value>)',
        },
        brand: {
          50: '#f0fdf4',
          100: '#dcfce7',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          900: '#14532d',
        },
        dark: {
          900: '#0d1117',
          800: '#161b22',
          700: '#21262d',
          600: '#30363d',
        },
        paper: {
          DEFAULT: '#F3F1EA',
          alt: '#EAE7DC',
        },
        card: {
          DEFAULT: '#FBFAF6',
        },
        ink: {
          DEFAULT: '#1F2421',
          soft: '#565B54',
          faint: '#8B8F86',
        },
        line: {
          DEFAULT: '#DBD6C7',
          strong: '#C7C1AE',
        },
        walnut: {
          DEFAULT: '#A8623E',
          soft: '#F0E1D8',
        },
        blueprint: {
          DEFAULT: '#2C5079',
          deep: '#1D3A57',
          soft: '#E1E9F0',
        },
        sage: {
          DEFAULT: '#566E4E',
          soft: '#E4EBE0',
        },
        amber: {
          DEFAULT: '#A9762E',
          soft: '#F3E7D2',
        },
        brick: {
          DEFAULT: '#A8432B',
          soft: '#F3E0DA',
        },
      },
      fontFamily: {
        display: ['var(--font-display)', 'sans-serif'],
        body: ['var(--font-body)', 'sans-serif'],
        mono: ['var(--font-mono)', 'monospace'],
      },
      borderRadius: {
        sm: '3px',
        md: '6px',
        lg: '10px',
      },
    },
  },
  plugins: [],
};
export default config;
