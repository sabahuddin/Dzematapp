export function normalizeImageUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  
  // If already absolute URL, return as-is
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  
  // For relative URLs starting with /uploads, prepend current origin
  // In dev mode (Vite middleware), both frontend and backend are on same origin
  if (url.startsWith('/uploads')) {
    return url; // Return verbatim - Express serves /uploads before Vite middleware
  }
  
  return url;
}
