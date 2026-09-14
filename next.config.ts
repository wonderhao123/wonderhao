import type { NextConfig } from "next";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

const isStaticExport = process.env.STATIC_EXPORT === "true";

const nextConfig: NextConfig = {
  devIndicators: false,
  output: isStaticExport ? "export" : "standalone",
  basePath: isStaticExport ? "/vnc" : "",
  assetPrefix: isStaticExport ? "/vnc/" : "",
  images: {
    unoptimized: true,
  },
};

export default nextConfig;

if (!isStaticExport) {
  initOpenNextCloudflareForDev();
}
