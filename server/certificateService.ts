import sharp from 'sharp';
import { createCanvas, GlobalFonts } from '@napi-rs/canvas';
import path from 'path';
import { promises as fs } from 'fs';
import { existsSync } from 'fs';
import { fileURLToPath } from 'url';

// Register custom font for certificate text rendering
let fontRegistered = false;
let fontFamily = 'DejaVu Sans'; // Use system font installed in Alpine

function registerFont() {
  if (fontRegistered) return fontFamily;
  
  console.log('[Certificate] Current working directory:', process.cwd());
  
  // List available system fonts
  const availableFonts = GlobalFonts.families.map((f: any) => f.family);
  console.log('[Certificate] Available font families:', availableFonts.join(', '));
  
  // Priority list of fonts to try (system fonts in Alpine + custom)
  const fontPriority = ['DejaVu Sans', 'DejaVuSans', 'Liberation Sans', 'Arial', 'sans-serif'];
  
  // Check if any preferred font is available
  for (const preferredFont of fontPriority) {
    if (availableFonts.some((f: string) => f.toLowerCase().includes(preferredFont.toLowerCase()))) {
      fontFamily = preferredFont;
      console.log(`[Certificate] ✅ Using system font: ${fontFamily}`);
      fontRegistered = true;
      return fontFamily;
    }
  }
  
  // Try to register custom font as fallback
  const possiblePaths = [
    path.join(process.cwd(), 'public', 'fonts', 'DejaVuSans-Bold.ttf'),
    '/app/public/fonts/DejaVuSans-Bold.ttf',
    '/usr/share/fonts/ttf-dejavu/DejaVuSans-Bold.ttf',
    '/usr/share/fonts/dejavu/DejaVuSans-Bold.ttf',
  ];
  
  console.log('[Certificate] Checking custom font paths:', possiblePaths);
  
  for (const fontPath of possiblePaths) {
    if (existsSync(fontPath)) {
      try {
        GlobalFonts.registerFromPath(fontPath, 'CustomFont');
        console.log(`[Certificate] ✅ Custom font registered from: ${fontPath}`);
        fontFamily = 'CustomFont';
        fontRegistered = true;
        return fontFamily;
      } catch (error) {
        console.error(`[Certificate] ❌ Failed to register custom font:`, error);
      }
    }
  }
  
  console.log('[Certificate] ⚠️ Using fallback font: sans-serif');
  fontFamily = 'sans-serif';
  fontRegistered = true;
  return fontFamily;
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
  const registeredFontFamily = registerFont();
  console.log(`[Certificate] Using font family: ${registeredFontFamily}`);

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

  // Set up text rendering - use registered font family
  let fontSpec = `bold ${fontSize}px ${registeredFontFamily}`;
  ctx.font = fontSpec;
  console.log(`[Certificate] Set font to: ${ctx.font}`);
  
  // If font wasn't applied correctly, try fallback
  if (!ctx.font || ctx.font === '') {
    fontSpec = `bold ${fontSize}px Arial, sans-serif`;
    ctx.font = fontSpec;
    console.log(`[Certificate] Fallback font applied: ${ctx.font}`);
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
