import Image from "next/image";
import { assetPath } from "@/lib/world/assets";

export function Logo() {
  return (
    <Image
      src={assetPath("/hao-logo.svg")}
      alt="WONDERHAO"
      width={428}
      height={450}
      className="site-logo"
      unoptimized
    />
  );
}
