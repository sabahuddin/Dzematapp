import sharp from 'sharp';
import path from 'path';
import { promises as fs, existsSync } from 'fs';

// Font path
const fontPath = path.join(process.cwd(), 'public', 'fonts', 'DejaVuSans-Bold.ttf');
console.log('[Certificate] Font path:', fontPath);
console.log('[Certificate] Font exists:', existsSync(fontPath));

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

  console.log(`[Certificate] ===== STARTING CERTIFICATE GENERATION (sharp text) =====`);
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

  // Check font exists
  if (!existsSync(fontPath)) {
    console.error(`[Certificate] ERROR: Font file not found at ${fontPath}`);
    throw new Error(`Font file not found: ${fontPath}`);
  }
  console.log(`[Certificate] Using font: ${fontPath}`);

  // Use sharp's text() to create text image with custom font
  // sharp uses libvips which has Pango/fontconfig support
  const textImage = await sharp({
    text: {
      text: `<span foreground="${fontColor}" size="${fontSize * 1000}">${recipientName}</span>`,
      font: 'DejaVu Sans Bold',
      fontfile: fontPath,
      rgba: true,
      dpi: 300,
    }
  }).png().toBuffer();

  const textMeta = await sharp(textImage).metadata();
  console.log(`[Certificate] Text image created: ${textMeta.width}x${textMeta.height}, size: ${textImage.length} bytes`);

  // Calculate position based on alignment
  let left = textPositionX;
  if (textAlign === 'center' && textMeta.width) {
    left = textPositionX - Math.floor(textMeta.width / 2);
  } else if (textAlign === 'right' && textMeta.width) {
    left = textPositionX - textMeta.width;
  }

  // Adjust top position (textPositionY is baseline, we need top-left)
  const top = textPositionY - Math.floor((textMeta.height || fontSize) / 2);

  console.log(`[Certificate] Compositing at position: left=${left}, top=${top}`);

  // Composite the text over the template
  const finalImage = await sharp(templateBuffer)
    .composite([
      {
        input: textImage,
        top: Math.max(0, top),
        left: Math.max(0, left),
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
