import sharp from 'sharp';
import path from 'path';
import { promises as fs, existsSync } from 'fs';
import { chromium, Browser } from 'playwright';

let browser: Browser | null = null;

async function getBrowser(): Promise<Browser> {
  if (!browser) {
    console.log('[Certificate] Launching Chromium browser...');
    browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    console.log('[Certificate] ✅ Chromium browser launched');
  }
  return browser;
}

export interface CertificateGenerationOptions {
  templateImagePath: string;
  recipientName: string;
  textPositionX: number;
  textPositionY: number;
  fontSize: number;
  fontColor: string;
  textAlign: 'left' | 'center' | 'right';
}

export async function generateCertificate(options: CertificateGenerationOptions): Promise<Buffer> {
  const {
    templateImagePath,
    recipientName,
    textPositionX,
    textPositionY,
    fontSize,
    fontColor,
    textAlign
  } = options;

  console.log(`[Certificate] ===== STARTING CERTIFICATE GENERATION (Playwright) =====`);
  console.log(`[Certificate] Options received:`, JSON.stringify(options, null, 2));

  // Normalize path - strip leading '/' to avoid path.join issues
  const relPath = templateImagePath.replace(/^\//, '');
  const templatePath = path.join(process.cwd(), 'public', relPath);
  
  console.log(`[Certificate] Reading template from: ${templatePath}`);
  
  // Check if template file exists
  if (!existsSync(templatePath)) {
    console.error(`[Certificate] ERROR: Template file not found at ${templatePath}`);
    throw new Error(`Template file not found: ${templatePath}`);
  }
  
  // Get template image metadata
  const templateBuffer = await fs.readFile(templatePath);
  const metadata = await sharp(templateBuffer).metadata();
  const imageWidth = metadata.width || 1200;
  const imageHeight = metadata.height || 800;
  console.log(`[Certificate] Image dimensions: ${imageWidth}x${imageHeight}`);

  // Convert template to base64 for embedding in HTML
  const templateBase64 = templateBuffer.toString('base64');
  const mimeType = templatePath.endsWith('.webp') ? 'image/webp' : 
                   templatePath.endsWith('.png') ? 'image/png' : 'image/jpeg';

  // Calculate text position based on alignment
  let textX = textPositionX;
  let cssTextAlign = textAlign;
  let transform = '';
  
  if (textAlign === 'center') {
    transform = 'translateX(-50%)';
  } else if (textAlign === 'right') {
    transform = 'translateX(-100%)';
  }

  // Create HTML with the certificate
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          width: ${imageWidth}px;
          height: ${imageHeight}px;
          overflow: hidden;
        }
        .container {
          position: relative;
          width: ${imageWidth}px;
          height: ${imageHeight}px;
        }
        .template {
          position: absolute;
          top: 0;
          left: 0;
          width: ${imageWidth}px;
          height: ${imageHeight}px;
        }
        .name {
          position: absolute;
          left: ${textX}px;
          top: ${textPositionY}px;
          transform: ${transform};
          font-family: 'DejaVu Sans', 'Arial', 'Helvetica', sans-serif;
          font-size: ${fontSize}px;
          font-weight: bold;
          color: ${fontColor};
          white-space: nowrap;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <img class="template" src="data:${mimeType};base64,${templateBase64}" />
        <div class="name">${recipientName}</div>
      </div>
    </body>
    </html>
  `;

  console.log(`[Certificate] Generated HTML, launching browser...`);

  // Use Playwright to render HTML to image
  const browserInstance = await getBrowser();
  const page = await browserInstance.newPage();
  
  try {
    await page.setViewportSize({ width: imageWidth, height: imageHeight });
    await page.setContent(html, { waitUntil: 'networkidle' });
    
    // Take screenshot
    const screenshot = await page.screenshot({ 
      type: 'png',
      fullPage: false,
      clip: { x: 0, y: 0, width: imageWidth, height: imageHeight }
    });
    
    console.log(`[Certificate] Screenshot taken, size: ${screenshot.length} bytes`);
    console.log(`[Certificate] ===== CERTIFICATE GENERATION COMPLETE =====`);
    
    return screenshot;
  } finally {
    await page.close();
  }
}

export async function saveCertificate(certificateBuffer: Buffer, filename: string, tenantId: string): Promise<string> {
  const certificatesDir = path.join(process.cwd(), 'public', 'uploads', tenantId, 'certificates', 'generated');
  await fs.mkdir(certificatesDir, { recursive: true });
  
  const filePath = path.join(certificatesDir, filename);
  await fs.writeFile(filePath, certificateBuffer);
  
  return `/uploads/${tenantId}/certificates/generated/${filename}`;
}

// Cleanup browser on process exit
process.on('exit', async () => {
  if (browser) {
    await browser.close();
  }
});
