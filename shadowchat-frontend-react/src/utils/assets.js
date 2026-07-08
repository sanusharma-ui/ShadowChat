const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";

export function resolveAssetUrl(src) {
  if (!src) return "";

  if (/^https?:\/\//i.test(src)) {
    return src;
  }

  const base = API_BASE_URL.replace(/\/$/, "");
  const cleanPath = src.startsWith("/") ? src : `/${src}`;
  return `${base}${cleanPath}`;
}