import sharp from 'sharp';
import { createCanvas } from '@napi-rs/canvas';
import path from 'path';
import { promises as fs } from 'fs';

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

  // Read the template image
  const templatePath = path.join(process.cwd(), 'public', templateImagePath);
  const templateBuffer = await fs.readFile(templatePath);
  
  // Get template image metadata
  const metadata = await sharp(templateBuffer).metadata();
  const imageWidth = metadata.width || 1200;
  const imageHeight = metadata.height || 800;

  // Create canvas for text overlay
  const canvas = createCanvas(imageWidth, imageHeight);
  const ctx = canvas.getContext('2d');

  // Set up text rendering with multiple font fallbacks
  ctx.font = `bold ${fontSize}px "Times New Roman", "DejaVu Serif", "Liberation Serif", serif`;
  ctx.fillStyle = fontColor;
  ctx.textAlign = 'center';  // Always center horizontally
  ctx.textBaseline = 'middle';  // Always center vertically

  // ALWAYS center the text in the middle of the image
  // User will adjust template design (add line) to match this position
  const centerX = imageWidth / 2;
  const centerY = imageHeight / 2;

  console.log(`[Certificate] Image size: ${imageWidth}x${imageHeight}, centering text "${recipientName}" at (${centerX}, ${centerY}), font: ${fontSize}px`);

  // Draw the text at the center
  ctx.fillText(recipientName, centerX, centerY);

  // Convert canvas to buffer
  const textBuffer = canvas.toBuffer('image/png');

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

  return finalImage;
}

export async function saveCertificate(certificateBuffer: Buffer, filename: string): Promise<string> {
  const certificatesDir = path.join(process.cwd(), 'public', 'uploads', 'certificates', 'generated');
  await fs.mkdir(certificatesDir, { recursive: true });
  
  const filePath = path.join(certificatesDir, filename);
  await fs.writeFile(filePath, certificateBuffer);
  
  return `/uploads/certificates/generated/${filename}`;
}
