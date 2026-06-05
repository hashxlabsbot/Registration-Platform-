import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ['pdfkit', 'nodemailer', 'canvas'],
};

export default nextConfig;
