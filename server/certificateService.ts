import sharp from 'sharp';
import { createCanvas, GlobalFonts } from '@napi-rs/canvas';
import path from 'path';
import { promises as fs } from 'fs';
import { existsSync } from 'fs';
import { fileURLToPath } from 'url';

// Register custom font for certificate text rendering
let fontRegistered = false;

function registerFont() {
  if (fontRegistered) return true;
  
  // Try to register custom font
  const possiblePaths = [
    path.join(process.cwd(), 'public', 'fonts', 'DejaVuSans-Bold.ttf'),
    '/app/public/fonts/DejaVuSans-Bold.ttf',
    path.join(process.cwd(), 'server', 'fonts', 'DejaVuSans-Bold.ttf'),
  ];
  
  for (const fontPath of possiblePaths) {
    if (existsSync(fontPath)) {
      try {
        GlobalFonts.registerFromPath(fontPath, 'CustomFont');
        console.log(`[Certificate] Custom font registered from: ${fontPath}`);
        fontRegistered = true;
        return true;
      } catch (error) {
        console.error(`[Certificate] Failed to register custom font:`, error);
      }
    }
  }
  
  console.log('[Certificate] Using system fonts (custom font not found)');
  fontRegistered = true;
  return true;
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
  
  // Register font before generating certificate
  registerFont();

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

  // Clear the canvas to ensure transparency
  ctx.clearRect(0, 0, imageWidth, imageHeight);

  // Set up text rendering - try custom font first, fallback to system fonts
  let fontSpec = `bold ${fontSize}px CustomFont`;
  ctx.font = fontSpec;
  
  // If custom font didn't work, fallback to Arial or system fonts
  if (!ctx.font.includes('CustomFont')) {
    fontSpec = `bold ${fontSize}px Arial, sans-serif`;
    ctx.font = fontSpec;
  }
  
  ctx.fillStyle = fontColor;
  ctx.textAlign = textAlign;
  ctx.textBaseline = 'middle';

  console.log(`[Certificate] Drawing text: "${recipientName}"`);
  console.log(`[Certificate] Position: (${textPositionX}, ${textPositionY})`);
  console.log(`[Certificate] Font spec: ${fontSpec}`);
  console.log(`[Certificate] Color: ${fontColor}, Align: ${textAlign}`);

  // Draw text at the configured position from template
  ctx.fillText(recipientName, textPositionX, textPositionY);
  
  // Measure text to verify it was drawn
  const textMetrics = ctx.measureText(recipientName);
  console.log(`[Certificate] Text metrics - width: ${textMetrics.width}px`);

  // Convert canvas to buffer
  const textBuffer = canvas.toBuffer('image/png');
  console.log(`[Certificate] Text overlay buffer size: ${textBuffer.length} bytes`);

  // Composite the text over the template
  const finalImage = await sharp(templateBuffer)
    .composite([
      {
        input: textBuffer,
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
