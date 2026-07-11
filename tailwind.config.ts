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
        'rule-strong': '#D3C4B8', // dashed borders on Waiting Frames — needs more contrast
        ink: '#2A2231',          // body text — violet-tinted black, never pure #000
        'ink-soft': '#6B6156',   // secondary text

        // 1.2 palette — richer, more saturated violet (Denard's #5115AB / #350E70),
        // with -2/-3 re-tuned to sit between primary and the deep surface.
        violet: '#5115AB',       // primary actions, headings on paper
        'violet-2': '#6C2BD9',   // hover, interactive states — brighter than primary
        'violet-3': '#B99CF5',   // accents on dark surfaces (light)
        'violet-deep': '#350E70',// the deep violet surface (Story view, photo bleeds, heroes)

        ember: '#F97316',        // HIGHLIGHT ONLY. a dot, a rule, a number. Brightened for 1.2.
      },
      backgroundImage: {
        // 1.2 gradients. The signature violet→ember reserved for the main title
        // and section headers (via bg-clip-text). The bleed is the violet
        // multiply-feel overlay laid at the bottom of photos and heroes.
        'ever-gradient': 'linear-gradient(92deg, #5115AB 0%, #F97316 100%)',
        'violet-bleed': 'linear-gradient(to top, rgba(53,14,112,0.85) 0%, rgba(53,14,112,0.15) 45%, rgba(53,14,112,0) 100%)',
        'violet-hero': 'linear-gradient(135deg, #350E70 0%, #5115AB 55%, #6C2BD9 100%)',
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
        // 1.2: dark violet surfaces glow instead of merely sitting there
        glow: '0 0 28px rgba(81, 21, 171, 0.35)',
        'glow-soft': '0 0 18px rgba(53, 14, 112, 0.25)',
      },
    },
  },
  plugins: [],
};

export default config;
