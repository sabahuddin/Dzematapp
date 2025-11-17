export function normalizeImageUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  
  // If already absolute URL, return as-is
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  
  // For relative URLs starting with /uploads, use API URL or current origin
  if (url.startsWith('/uploads')) {
    const apiUrl = import.meta.env.VITE_API_URL || window.location.origin;
    return `${apiUrl}${url}`;
  }
  
  return url;
}
