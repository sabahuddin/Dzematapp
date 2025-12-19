import sharp from 'sharp';
import path from 'path';
import { promises as fs, readFileSync, existsSync } from 'fs';

// Cache the font as Base64 to avoid repeated disk I/O
let fontBase64Cache: string | null = null;

function getFontBase64(): string {
  if (fontBase64Cache) return fontBase64Cache;
  
  const fontPath = path.join(process.cwd(), 'public', 'fonts', 'DejaVuSans-Bold.ttf');
  console.log('[Certificate] Loading font from:', fontPath);
  
  if (!existsSync(fontPath)) {
    console.error('[Certificate] ❌ Font file not found at:', fontPath);
    throw new Error(`Font file not found: ${fontPath}`);
  }
  
  const fontBuffer = readFileSync(fontPath);
  fontBase64Cache = fontBuffer.toString('base64');
  console.log('[Certificate] ✅ Font loaded and cached, size:', fontBuffer.length, 'bytes');
  
  return fontBase64Cache;
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

  console.log(`[Certificate] ===== STARTING CERTIFICATE GENERATION =====`);
  console.log(`[Certificate] Options received:`, JSON.stringify(options, null, 2));

  // Load and cache font as Base64
  const fontBase64 = getFontBase64();

  // Normalize path - strip leading '/' to avoid path.join issues
  const relPath = templateImagePath.replace(/^\//, '');
  const templatePath = path.join(process.cwd(), 'public', relPath);
  
  console.log(`[Certificate] Reading template from: ${templatePath}`);
  
  // Check if template file exists
  try {
    await fs.access(templatePath);
    console.log(`[Certificate] Template file exists`);
  } catch (e) {
    console.error(`[Certificate] ERROR: Template file not found at ${templatePath}`);
    throw new Error(`Template file not found: ${templatePath}`);
  }
  
  const templateBuffer = await fs.readFile(templatePath);
  console.log(`[Certificate] Template buffer size: ${templateBuffer.length} bytes`);
  
  // Get template image metadata
  const metadata = await sharp(templateBuffer).metadata();
  const imageWidth = metadata.width || 1200;
  const imageHeight = metadata.height || 800;
  console.log(`[Certificate] Image dimensions: ${imageWidth}x${imageHeight}`);

  // Escape special XML characters in recipient name
  const escapedName = recipientName
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');

  // Calculate text anchor based on alignment
  let textAnchor = 'middle';
  if (textAlign === 'left') {
    textAnchor = 'start';
  } else if (textAlign === 'right') {
    textAnchor = 'end';
  }

  console.log(`[Certificate] Drawing text: "${recipientName}"`);
  console.log(`[Certificate] Position: (${textPositionX}, ${textPositionY})`);
  console.log(`[Certificate] Font size: ${fontSize}px, Color: ${fontColor}, Align: ${textAlign}`);

  // Create SVG with embedded Base64 font - this bypasses all system font dependencies
  const svgText = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${imageWidth}" height="${imageHeight}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <style type="text/css">
      @font-face {
        font-family: 'EmbeddedFont';
        src: url('data:font/truetype;base64,${fontBase64}') format('truetype');
        font-weight: bold;
        font-style: normal;
      }
    </style>
  </defs>
  <text 
    x="${textPositionX}" 
    y="${textPositionY}" 
    font-family="EmbeddedFont" 
    font-size="${fontSize}px" 
    font-weight="bold"
    fill="${fontColor}"
    text-anchor="${textAnchor}" 
    dominant-baseline="middle"
  >${escapedName}</text>
</svg>`;

  console.log(`[Certificate] SVG created with embedded Base64 font`);

  // Convert SVG to PNG buffer
  const textOverlay = await sharp(Buffer.from(svgText))
    .png()
    .toBuffer();

  console.log(`[Certificate] Text overlay size: ${textOverlay.length} bytes`);

  // Composite the text over the template
  const finalImage = await sharp(templateBuffer)
    .composite([
      {
        input: textOverlay,
        blend: 'over'
      }
    ])
    .png()
    .toBuffer();

  console.log(`[Certificate] Final image buffer size: ${finalImage.length} bytes`);
  console.log(`[Certificate] ===== CERTIFICATE GENERATION COMPLETE =====`);

  return finalImage;
}

export async function saveCertificate(certificateBuffer: Buffer, filename: string, tenantId: string): Promise<string> {
  const certificatesDir = path.join(process.cwd(), 'public', 'uploads', tenantId, 'certificates', 'generated');
  await fs.mkdir(certificatesDir, { recursive: true });
  
  const filePath = path.join(certificatesDir, filename);
  await fs.writeFile(filePath, certificateBuffer);
  
  return `/uploads/${tenantId}/certificates/generated/${filename}`;
}
