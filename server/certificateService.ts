import { Resvg } from '@resvg/resvg-js';
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

  console.log(`[Certificate] ===== STARTING CERTIFICATE GENERATION (resvg) =====`);
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

  // Determine text-anchor based on alignment
  let textAnchor = 'middle';
  if (textAlign === 'left') {
    textAnchor = 'start';
  } else if (textAlign === 'right') {
    textAnchor = 'end';
  }

  // Escape special characters for XML
  const escapedName = recipientName
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');

  // Check font exists first
  if (!existsSync(fontPath)) {
    console.error(`[Certificate] ERROR: Font file not found at ${fontPath}`);
    throw new Error(`Font file not found: ${fontPath}`);
  }

  console.log(`[Certificate] Using font from: ${fontPath}`);

  // Create SVG with text - use exact internal font name "DejaVu Sans"
  // The font file DejaVuSans-Bold.ttf has internal name "DejaVu Sans" with Bold style
  const svg = `<svg width="${imageWidth}" height="${imageHeight}" xmlns="http://www.w3.org/2000/svg">
  <text 
    x="${textPositionX}" 
    y="${textPositionY}" 
    font-family="DejaVu Sans" 
    font-size="${fontSize}" 
    fill="${fontColor}" 
    text-anchor="${textAnchor}" 
    dominant-baseline="middle"
    font-weight="bold"
  >${escapedName}</text>
</svg>`;

  console.log(`[Certificate] SVG created for: "${escapedName}"`);

  // Render SVG to PNG using resvg with custom font
  const resvg = new Resvg(svg, {
    font: {
      fontFiles: [fontPath],
      loadSystemFonts: false,
      defaultFontFamily: 'DejaVu Sans',
    },
  });
  
  console.log(`[Certificate] Resvg rendering...`);

  const pngData = resvg.render();
  const textOverlay = pngData.asPng();
  console.log(`[Certificate] Text overlay rendered, size: ${textOverlay.length} bytes`);

  // Composite the text over the template
  const finalImage = await sharp(templateBuffer)
    .composite([
      {
        input: textOverlay,
        top: 0,
        left: 0
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
