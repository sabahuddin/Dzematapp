import sharp from 'sharp';
import { createCanvas, GlobalFonts } from '@napi-rs/canvas';
import path from 'path';
import { promises as fs } from 'fs';
import { existsSync } from 'fs';

// Initialize font registration
let fontInitialized = false;

function initializeFont(): string {
  if (fontInitialized) return 'DejaVu Sans';
  
  console.log('[Certificate] Initializing fonts...');
  console.log('[Certificate] Available fonts:', GlobalFonts.families.map((f: any) => f.family).join(', '));
  
  // Try to register custom font
  const fontPaths = [
    '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf',
    '/usr/share/fonts/dejavu/DejaVuSans-Bold.ttf',
    path.join(process.cwd(), 'public', 'fonts', 'DejaVuSans-Bold.ttf'),
  ];
  
  for (const fontPath of fontPaths) {
    if (existsSync(fontPath)) {
      try {
        GlobalFonts.registerFromPath(fontPath, 'CertificateFont');
        console.log(`[Certificate] ✅ Registered font from: ${fontPath}`);
        fontInitialized = true;
        return 'CertificateFont';
      } catch (e) {
        console.log(`[Certificate] Failed to register ${fontPath}:`, e);
      }
    }
  }
  
  // Use available system font
  const availableFonts = GlobalFonts.families.map((f: any) => f.family);
  if (availableFonts.includes('DejaVu Sans')) {
    fontInitialized = true;
    return 'DejaVu Sans';
  }
  
  fontInitialized = true;
  return 'sans-serif';
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

  // Initialize font
  const fontFamily = initializeFont();
  console.log(`[Certificate] Using font family: ${fontFamily}`);

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

  // Set up text rendering
  ctx.font = `bold ${fontSize}px "${fontFamily}"`;
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
  console.log(`[Certificate] Font: bold ${fontSize}px "${fontFamily}"`);
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
