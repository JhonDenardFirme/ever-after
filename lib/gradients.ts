// -----------------------------------------------------------------------------
// lib/gradients.ts (1.2)
//
// The "glowing gradient" from the Library frontispiece, as reusable CSS
// background strings — deep violet with a glow and hints of orange, in a few
// variations so repeated cards (reflections, epigraph) don't read identically.
// Pass paper-coloured text over these.
// -----------------------------------------------------------------------------

export const GLOW_GRADIENTS: string[] = [
  // violet glow top-left, warm hint bottom-right
  'radial-gradient(120% 100% at 16% 12%, rgba(124,58,237,0.55) 0%, rgba(124,58,237,0) 52%),' +
    'radial-gradient(100% 90% at 88% 94%, rgba(249,115,22,0.22) 0%, rgba(249,115,22,0) 55%),' +
    'linear-gradient(150deg, #3a1268 0%, #1f0a3c 60%, #170830 100%)',
  // mirrored — glow top-right, warm hint bottom-left
  'radial-gradient(120% 100% at 86% 14%, rgba(108,43,217,0.52) 0%, rgba(108,43,217,0) 52%),' +
    'radial-gradient(100% 90% at 12% 92%, rgba(249,115,22,0.24) 0%, rgba(249,115,22,0) 55%),' +
    'linear-gradient(205deg, #34115f 0%, #1c0938 60%, #150729 100%)',
  // centred bloom, warm base glow
  'radial-gradient(120% 110% at 50% 6%, rgba(139,74,255,0.5) 0%, rgba(139,74,255,0) 55%),' +
    'radial-gradient(90% 80% at 50% 104%, rgba(249,115,22,0.20) 0%, rgba(249,115,22,0) 60%),' +
    'linear-gradient(180deg, #38146c 0%, #1d0a3c 65%, #160830 100%)',
];

export function glowGradient(i: number): string {
  return GLOW_GRADIENTS[((i % GLOW_GRADIENTS.length) + GLOW_GRADIENTS.length) % GLOW_GRADIENTS.length];
}
