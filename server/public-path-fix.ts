import path from "path";
import fs from "fs";

/**
 * Fix for production bundled code path resolution
 * When esbuild bundles the server code, import.meta.dirname becomes "." 
 * This causes serveStatic() to look for public in the wrong place.
 * 
 * Solution: Create a public symlink in the expected location
 */
export function ensurePublicPathSymlink() {
  if (process.env.NODE_ENV !== 'production') {
    return; // Only needed in production
  }

  const currentDir = process.cwd();
  const publicSourcePath = path.join(currentDir, 'public');
  const publicLinkPath = path.join(currentDir, 'server', 'public');

  // If public already exists in current directory, we're good
  if (fs.existsSync(publicSourcePath)) {
    // Ensure the symlink exists for backwards compatibility
    if (!fs.existsSync(publicLinkPath)) {
      try {
        fs.mkdirSync(path.dirname(publicLinkPath), { recursive: true });
        fs.symlinkSync('../public', publicLinkPath, 'dir');
        console.log(`🔗 Created symlink: ${publicLinkPath} -> ../public`);
      } catch (err) {
        // Symlink might already exist or permission denied - not critical
        console.log(`ℹ️ Could not create symlink (may already exist): ${err}`);
      }
    }
    return;
  }

  // If public doesn't exist in current dir, check if it's in dist/
  const distPublicPath = path.join(currentDir, 'dist', 'public');
  if (fs.existsSync(distPublicPath)) {
    console.log(`⚠️ Found public in dist/ directory, symlinking to current directory`);
    try {
      fs.symlinkSync('dist/public', publicSourcePath, 'dir');
      console.log(`🔗 Created symlink: ${publicSourcePath} -> dist/public`);
    } catch (err) {
      console.error(`❌ Failed to create symlink: ${err}`);
    }
  }
}
