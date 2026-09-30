import type { NextConfig } from "next";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

const isStaticExport = process.env.STATIC_EXPORT === "true";

const nextConfig: NextConfig = {
  devIndicators: false,
  env: { NEXT_PUBLIC_BASE_PATH: isStaticExport ? "/wonderhao" : "" },
  output: isStaticExport ? "export" : "standalone",
  basePath: isStaticExport ? "/wonderhao" : "",
  assetPrefix: isStaticExport ? "/wonderhao/" : "",
  images: {
    unoptimized: true,
  },
};

export default nextConfig;

if (!isStaticExport && process.env.NODE_ENV === "development") {
  initOpenNextCloudflareForDev();
}
