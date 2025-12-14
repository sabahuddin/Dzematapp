import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';

const languages = [
  { code: 'bs', name: 'Bosnian', file: 'dashboard-preview-bs.png', currency: 'BAM' },
  { code: 'de', name: 'German', file: 'dashboard-preview-de.png', currency: 'EUR' },
  { code: 'en', name: 'English', file: 'dashboard-preview-en.png', currency: 'USD' },
  { code: 'sq', name: 'Albanian', file: 'dashboard-preview-al.png', currency: 'EUR' },
  { code: 'tr', name: 'Turkish', file: 'dashboard-preview-tr.png', currency: 'EUR' },
];

const APP_URL = process.env.APP_URL || 'http://localhost:5000';
const USERNAME = 'admin';
const PASSWORD = 'admin123';

async function generateScreenshots() {
  console.log('Starting dashboard screenshot generation...');
  
  const browser = await chromium.launch({ 
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    deviceScaleFactor: 2,
  });
  
  const page = await context.newPage();
  
  try {
    console.log(`Navigating to ${APP_URL}...`);
    await page.goto(APP_URL, { waitUntil: 'networkidle', timeout: 60000 });
    
    // Step 1: Enter tenant code if needed
    const tenantVerifyButton = await page.$('[data-testid="button-verify-tenant"]');
    if (tenantVerifyButton) {
      console.log('Entering tenant code...');
      await page.fill('[data-testid="input-tenant-code"] input', 'DEMO2025');
      await page.click('[data-testid="button-verify-tenant"]');
      await page.waitForTimeout(2000);
    }
    
    // Step 2: Login
    console.log('Logging in...');
    await page.waitForSelector('[data-testid="input-username"] input', { timeout: 10000 });
    await page.fill('[data-testid="input-username"] input', USERNAME);
    await page.fill('[data-testid="input-password"] input', PASSWORD);
    await page.click('[data-testid="button-login"]');
    
    await page.waitForURL('**/dashboard**', { timeout: 30000 }).catch(() => {
      console.log('Waiting for dashboard to load...');
    });
    await page.waitForTimeout(3000);
    
    for (const lang of languages) {
      console.log(`\nGenerating screenshot for ${lang.name} (${lang.code}), currency: ${lang.currency}...`);
      
      await page.evaluate(({ langCode, currency }) => {
        localStorage.setItem('language', langCode);
        localStorage.setItem('currency', currency);
      }, { langCode: lang.code, currency: lang.currency });
      
      await page.reload({ waitUntil: 'networkidle' });
      await page.waitForTimeout(2000);
      
      await page.waitForSelector('[data-testid="dashboard-content"], .MuiCard-root', { timeout: 10000 }).catch(() => {
        console.log('Dashboard content loaded');
      });
      
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
    
  } catch (error) {
    console.error('Error generating screenshots:', error);
    throw error;
  } finally {
    await browser.close();
  }
}

generateScreenshots().catch(console.error);
