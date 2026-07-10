import type { Config } from 'tailwindcss';

// -----------------------------------------------------------------------------
// The Ever After token set. The ratio rule from the masterplan:
//   paper is the room (~60%), violet is the furniture (~35%),
//   ember is a single lit candle (~5% — badges, rules, numbers. NEVER a panel).
// If `ember` ever ends up as a background on anything bigger than a badge,
// that's a design bug, not a bold choice.
// -----------------------------------------------------------------------------
const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        paper: '#F7F3EC',        // page background — the room
        paper2: '#F1EADF',       // raised surfaces, cards
        rule: '#E2D7C6',         // hairlines, dividers
        ink: '#2A2231',          // body text — violet-tinted black, never pure #000
        'ink-soft': '#6B6156',   // secondary text

        violet: '#4A3668',       // primary actions, headings on paper
        'violet-2': '#6B4EA8',   // hover, interactive states
        'violet-3': '#A987E8',   // accents on dark surfaces
        'violet-deep': '#1E1729',// the ONLY dark surface (Story view, photo bleeds)

        ember: '#E0722F',        // HIGHLIGHT ONLY. a dot, a rule, a number.
      },
      fontFamily: {
        // Serif = anything the STORY says. Sans = anything the INTERFACE says.
        // That split is the typographic version of "never speak like software".
        serif: ['var(--font-serif)', 'Georgia', 'serif'],
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        // shelfLift's resting + hover shadows, named so motion + CSS agree
        shelf: '0 1px 2px rgba(42, 34, 49, 0.08)',
        'shelf-lifted': '0 14px 28px rgba(42, 34, 49, 0.14)',
      },
    },
  },
  plugins: [],
};

export default config;
