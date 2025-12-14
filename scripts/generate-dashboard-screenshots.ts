import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';

const languages = [
  { code: 'bs', name: 'Bosnian', file: 'dashboard-preview-bs.png' },
  { code: 'de', name: 'German', file: 'dashboard-preview-de.png' },
  { code: 'en', name: 'English', file: 'dashboard-preview-en.png' },
  { code: 'sq', name: 'Albanian', file: 'dashboard-preview-al.png' },
  { code: 'tr', name: 'Turkish', file: 'dashboard-preview-tr.png' },
];

async function generateScreenshots() {
  console.log('Starting dashboard screenshot generation from static mockup...');
  
  const browser = await chromium.launch({ 
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    deviceScaleFactor: 2,
  });
  
  const page = await context.newPage();
  const mockupPath = path.join(process.cwd(), 'scripts', 'dashboard-mockup.html');
  
  for (const lang of languages) {
    console.log(`\nGenerating screenshot for ${lang.name} (${lang.code})...`);
    
    const fileUrl = `file://${mockupPath}?lang=${lang.code}`;
    await page.goto(fileUrl, { waitUntil: 'networkidle' });
    await page.waitForTimeout(500);
    
    const marketingPath = path.join(process.cwd(), 'marketing', 'images', lang.file);
    const clientPublicPath = path.join(process.cwd(), 'client', 'public', 'images', lang.file);
    
    await page.screenshot({ 
      path: marketingPath,
      fullPage: false,
      clip: { x: 0, y: 0, width: 1920, height: 1080 }
    });
    console.log(`  Saved: ${marketingPath}`);
    
    fs.copyFileSync(marketingPath, clientPublicPath);
    console.log(`  Copied to: ${clientPublicPath}`);
  }
  
  console.log('\n✅ All screenshots generated successfully!');
  await browser.close();
}

generateScreenshots().catch(console.error);
