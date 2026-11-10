import type { NextConfig } from "next";

const noindex = [{ key: "X-Robots-Tag", value: "noindex, nofollow" }];

const nextConfig: NextConfig = {
  allowedDevOrigins: ["127.0.0.1"],
  async headers() {
    return [
      { source: "/api/:path*", headers: noindex },
      { source: "/m/:path*", headers: noindex },
      { source: "/indexnow.txt", headers: noindex },
      {
        source: "/models/:file*",
        headers: [{ key: "Cache-Control", value: "public, max-age=86400, stale-while-revalidate=604800" }],
      },
    ];
  },
  async redirects() {
    return [
      {
        source: "/:path*",
        has: [{ type: "host", value: "drukarycz.pl" }],
        destination: "https://www.drukarycz.pl/:path*",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
