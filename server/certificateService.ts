import sharp from 'sharp';
import { createCanvas, GlobalFonts } from '@napi-rs/canvas';
import path from 'path';
import { promises as fs, existsSync, readFileSync } from 'fs';

// Font configuration
const FONT_FAMILY = 'DzematCertFont';
const fontPath = path.join(process.cwd(), 'public', 'fonts', 'DejaVuSans-Bold.ttf');

// Register font using BUFFER method (more reliable in Docker)
console.log('[Certificate] Font path:', fontPath);
console.log('[Certificate] Font exists:', existsSync(fontPath));

let fontRegistered = false;

if (existsSync(fontPath)) {
  try {
    // Read font file into buffer
    const fontBuffer = readFileSync(fontPath);
    console.log('[Certificate] Font buffer size:', fontBuffer.length, 'bytes');
    
    // Register using buffer (more reliable than path in Docker)
    GlobalFonts.register(fontBuffer, FONT_FAMILY);
    console.log('[Certificate] Font registered via buffer as:', FONT_FAMILY);
    
    // List all registered fonts
    const families = GlobalFonts.families.map((f: any) => f.family);
    console.log('[Certificate] Available font families:', families.join(', '));
    
    // Check if our font is in the list
    fontRegistered = families.includes(FONT_FAMILY);
    console.log('[Certificate] Our font in list:', fontRegistered);
    
    // Verify font works by doing a test render
    const testCanvas = createCanvas(200, 50);
    const testCtx = testCanvas.getContext('2d');
    testCtx.font = `bold 20px "${FONT_FAMILY}"`;
    const testWidth = testCtx.measureText('TestČĆŽŠĐ').width;
    console.log('[Certificate] Font verification - Test text width:', testWidth, 'px');
    
    if (testWidth === 0) {
      console.error('[Certificate] ⚠️ WARNING: Font registered but not rendering!');
      // Try without quotes
      testCtx.font = `bold 20px ${FONT_FAMILY}`;
      const testWidth2 = testCtx.measureText('Test').width;
      console.log('[Certificate] Retry without quotes - width:', testWidth2, 'px');
    } else {
      console.log('[Certificate] ✅ Font working correctly');
    }
  } catch (e) {
    console.error('[Certificate] ❌ Font registration error:', e);
  }
} else {
  console.error('[Certificate] ❌ Font file not found:', fontPath);
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

  // Create canvas for text overlay
  const canvas = createCanvas(imageWidth, imageHeight);
  const ctx = canvas.getContext('2d');

  // Clear canvas (transparent background)
  ctx.clearRect(0, 0, imageWidth, imageHeight);

  // Set up text rendering - use registered font name
  // Note: Font is already bold, so we don't need "bold" prefix
  ctx.font = `${fontSize}px "${FONT_FAMILY}"`;
  ctx.fillStyle = fontColor;
  ctx.textBaseline = 'middle';
  
  // Set text alignment
  if (textAlign === 'center') {
    ctx.textAlign = 'center';
  } else if (textAlign === 'right') {
    ctx.textAlign = 'right';
  } else {
    ctx.textAlign = 'left';
  }

  // Measure text width for debugging
  const textMetrics = ctx.measureText(recipientName);
  console.log(`[Certificate] Drawing text: "${recipientName}"`);
  console.log(`[Certificate] Position: (${textPositionX}, ${textPositionY})`);
  console.log(`[Certificate] Font: ${fontSize}px "${FONT_FAMILY}"`);
  console.log(`[Certificate] Color: ${fontColor}, Align: ${textAlign}`);
  console.log(`[Certificate] Text width: ${textMetrics.width}px`);

  // Draw text
  ctx.fillText(recipientName, textPositionX, textPositionY);

  // Convert canvas to PNG buffer
  const textOverlay = canvas.toBuffer('image/png');
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
