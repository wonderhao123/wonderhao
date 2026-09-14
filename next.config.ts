import type { NextConfig } from "next";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

const isStaticExport = process.env.STATIC_EXPORT === "true";

const nextConfig: NextConfig = {
  devIndicators: false,
  output: isStaticExport ? "export" : "standalone",
  basePath: isStaticExport ? "/wonderhao" : "",
  assetPrefix: isStaticExport ? "/wonderhao/" : "",
  images: {
    unoptimized: true,
  },
};

export default nextConfig;

if (!isStaticExport) {
  initOpenNextCloudflareForDev();
}
