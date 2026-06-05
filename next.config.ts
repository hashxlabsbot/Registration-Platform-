import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ['pdfkit', 'sharp', 'nodemailer', 'canvas'],
};

export default nextConfig;
