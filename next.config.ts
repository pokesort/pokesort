import type { NextConfig } from "next";
import createNextIntlPlugin from 'next-intl/plugin';
const path = require('path');

const nextConfig: NextConfig = {
  /* config options here */
  allowedDevOrigins: [new URL(process.env.NEXT_PUBLIC_API_BASE_URL!).hostname],
  webpack: (config) => {
    config.resolve.alias['@'] = path.resolve(__dirname);
    return config;
  },
};

const withNextIntl = createNextIntlPlugin();
export default withNextIntl(nextConfig);