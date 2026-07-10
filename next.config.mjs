/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // Frames live in Supabase Storage. next/image needs to know that host is
    // trusted before it will optimize anything from it. Wildcard covers any
    // project ref, so this never breaks if I ever migrate Supabase projects.
    remotePatterns: [{ protocol: 'https', hostname: '*.supabase.co' }],
  },
};

export default nextConfig;
