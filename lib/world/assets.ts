import {CITY_ASSET_VERSION} from './city-version';
/** Next inlines this value for both static subpath and Cloudflare builds. */
export const assetPath = (path: string) =>
  `${process.env.NEXT_PUBLIC_BASE_PATH || ""}${path}`;

export const cityAsset = (file:string) => assetPath('/world/city/'+file)+'?v='+CITY_ASSET_VERSION;
