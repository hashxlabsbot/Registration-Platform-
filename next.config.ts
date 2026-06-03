import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: __dirname,
  },
  serverExternalPackages: ['pdfkit', 'sharp', 'nodemailer', 'canvas'],
};

export default nextConfig;
