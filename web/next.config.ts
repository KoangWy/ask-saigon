import type { NextConfig } from 'next';
const nextConfig: NextConfig = {
  turbopack: { rules: { '*.css': { loaders: ['@tailwindcss/turbopack'], as: '*.css' } } },
  async headers() {
    const csp = (ancestors: string) => `default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self'; font-src 'self' data:; frame-ancestors ${ancestors}; base-uri 'self'; object-src 'none'`;
    const common = [
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      { key: 'Permissions-Policy', value: 'geolocation=(self)' },
      { key: 'Access-Control-Allow-Origin', value: 'https://ask-saigon.vercel.app' },
    ];
    // Only /embed may be framed: it is the chat box partners place on their own sites (public/widget.js).
    return [
      { source: '/((?!embed(?:/|$)|api/v1/).*)', headers: [...common, { key: 'X-Frame-Options', value: 'DENY' }, { key: 'Content-Security-Policy', value: csp("'none'") }] },
      // The public data API sets its own CORS headers (lib/http.ts publicApi).
      { source: '/api/v1/:path*', headers: [common[0], common[1], { key: 'X-Frame-Options', value: 'DENY' }] },
      { source: '/embed', headers: [...common, { key: 'Content-Security-Policy', value: csp('*') }] },
    ];
  },
};
export default nextConfig;
