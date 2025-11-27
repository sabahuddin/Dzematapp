import express, { type Express } from "express";
import fs from "fs";
import path from "path";

/**
 * Custom static file serving middleware that handles bundled code path resolution
 * In production, when bundled by esbuild, import.meta.dirname doesn't resolve correctly
 * This provides a fallback that uses environment variable or multiple possible paths
 */
export function serveStaticFiles(app: Express) {
  // Try multiple possible paths for public directory
  const possiblePaths = [
    process.env.PUBLIC_PATH, // Set by index.ts in production
    path.resolve(process.cwd(), 'public'), // Current dir
    path.resolve(process.cwd(), '../public'), // Parent dir (if in dist)
    path.resolve(process.cwd(), 'dist', 'public'), // dist subdirectory
  ].filter(Boolean) as string[];

  let foundPath: string | null = null;
  for (const checkPath of possiblePaths) {
    if (fs.existsSync(checkPath)) {
      foundPath = checkPath;
      console.log(`📂 Serving static files from: ${foundPath}`);
      break;
    }
  }

  if (!foundPath) {
    console.error(`❌ Could not find public directory in any of:`);
    possiblePaths.forEach(p => console.error(`   - ${p}`));
    throw new Error(
      `Could not find the build directory for static files. Checked: ${possiblePaths.join(', ')}`
    );
  }

  // Serve static files
  app.use(express.static(foundPath));

  // Fall through to index.html for SPA routing
  app.use("*", (_req, res) => {
    res.sendFile(path.resolve(foundPath!, "index.html"));
  });
}
