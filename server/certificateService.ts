import sharp from 'sharp';
import { createCanvas, GlobalFonts } from '@napi-rs/canvas';
import path from 'path';
import { promises as fs } from 'fs';
import { existsSync } from 'fs';

// Font name constant
const FONT_NAME = 'CertificateFont';
let fontRegistered = false;

// Register embedded font at module load
function ensureFontRegistered(): void {
  if (fontRegistered) return;
  
  // Use font embedded in the project - this is the most reliable approach
  const embeddedFontPath = path.join(process.cwd(), 'public', 'fonts', 'DejaVuSans-Bold.ttf');
  
  console.log('[Certificate] Registering embedded font from:', embeddedFontPath);
  
  if (existsSync(embeddedFontPath)) {
    try {
      GlobalFonts.registerFromPath(embeddedFontPath, FONT_NAME);
      console.log('[Certificate] ✅ Font registered successfully:', FONT_NAME);
      fontRegistered = true;
    } catch (e) {
      console.error('[Certificate] ❌ Failed to register font:', e);
    }
  } else {
    console.error('[Certificate] ❌ Font file not found at:', embeddedFontPath);
  }
  
  // Log available fonts for debugging
  console.log('[Certificate] Available fonts:', GlobalFonts.families.map((f: any) => f.family).join(', '));
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

  // Ensure font is registered
  ensureFontRegistered();

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

  // Set up text rendering with embedded font
  ctx.font = `bold ${fontSize}px "${FONT_NAME}"`;
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

  console.log(`[Certificate] Drawing text: "${recipientName}"`);
  console.log(`[Certificate] Position: (${textPositionX}, ${textPositionY})`);
  console.log(`[Certificate] Font: bold ${fontSize}px "${FONT_NAME}"`);
  console.log(`[Certificate] Color: ${fontColor}, Align: ${textAlign}`);

  // Draw text
  ctx.fillText(recipientName, textPositionX, textPositionY);
  
  // Measure text width for debugging
  const textWidth = ctx.measureText(recipientName).width;
  console.log(`[Certificate] Text width: ${textWidth}px`);

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
