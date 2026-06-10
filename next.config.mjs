/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Emit a self-contained server bundle (.next/standalone) so the Docker
  // runtime image only needs Node + the traced dependencies — not node_modules.
  output: "standalone",
};

export default nextConfig;
