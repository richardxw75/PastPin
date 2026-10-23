// Bij publicatie op GitHub Pages draait de site onder /<repo-naam>; de workflow zet dit pad.
const basePath = process.env.PAGES_BASE_PATH || "";

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Volledig statische export: de app draait helemaal in de browser.
  output: "export",
  basePath,
  trailingSlash: true,
  images: { unoptimized: true },
};

export default nextConfig;
