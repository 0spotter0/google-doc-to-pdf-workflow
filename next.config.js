// basePath is empty for local dev; CI sets NEXT_PUBLIC_BASE_PATH to the repo
// subpath (e.g. /google-doc-to-pdf-workflow) for GitHub Pages project sites.
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export", // static HTML export → uploaded to GitHub Pages
  basePath,
  images: { unoptimized: true },
};

module.exports = nextConfig;
