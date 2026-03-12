/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  async headers() {
    return [{
      source: "/(.*)",
      headers: [
        { key: "Content-Security-Policy", value: "frame-src 'self' https://www.tradingview.com https://s.tradingview.com;" },
      ],
    }];
  },
};
module.exports = nextConfig;
