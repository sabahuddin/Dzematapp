import sharp from 'sharp';
import path from 'path';
import { promises as fs, existsSync } from 'fs';
import opentype from 'opentype.js';
import { Resvg } from '@resvg/resvg-js';

// Font path
const fontPath = path.join(process.cwd(), 'public', 'fonts', 'DejaVuSans-Bold.ttf');
console.log('[Certificate] Font path:', fontPath);
console.log('[Certificate] Font exists:', existsSync(fontPath));

// Cached font instance
let cachedFont: opentype.Font | null = null;

async function loadFont(): Promise<opentype.Font> {
  if (cachedFont) return cachedFont;
  
  const fontBuffer = await fs.readFile(fontPath);
  cachedFont = opentype.parse(fontBuffer.buffer as ArrayBuffer);
  console.log('[Certificate] Font loaded with opentype.js:', cachedFont.names.fontFamily);
  return cachedFont;
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

  console.log(`[Certificate] ===== STARTING CERTIFICATE GENERATION (opentype.js) =====`);
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

  // Load font with opentype.js
  const font = await loadFont();
  console.log(`[Certificate] Font loaded: ${font.names.fontFamily}`);

  // Get text path from opentype.js - this converts text to SVG path data
  const textPath = font.getPath(recipientName, 0, 0, fontSize);
  const pathData = textPath.toPathData(2);
  
  // Get text bounding box for alignment
  const bbox = textPath.getBoundingBox();
  const textWidth = bbox.x2 - bbox.x1;
  const textHeight = bbox.y2 - bbox.y1;
  console.log(`[Certificate] Text bounding box: width=${textWidth}, height=${textHeight}`);

  // Calculate X position based on alignment
  let adjustedX = textPositionX;
  if (textAlign === 'center') {
    adjustedX = textPositionX - textWidth / 2;
  } else if (textAlign === 'right') {
    adjustedX = textPositionX - textWidth;
  }

  // Adjust Y to account for baseline (opentype uses baseline at y=0)
  // bbox.y1 is typically negative (above baseline), bbox.y2 is below
  const adjustedY = textPositionY - bbox.y1 - textHeight / 2;

  console.log(`[Certificate] Adjusted position: x=${adjustedX}, y=${adjustedY}`);

  // Create SVG with the path data (no font needed - it's vector paths!)
  const svg = `<svg width="${imageWidth}" height="${imageHeight}" xmlns="http://www.w3.org/2000/svg">
  <path 
    d="${pathData}" 
    fill="${fontColor}"
    transform="translate(${adjustedX}, ${adjustedY})"
  />
</svg>`;

  console.log(`[Certificate] SVG with path data created, length: ${svg.length} chars`);

  // Render SVG to PNG using resvg (no font loading needed!)
  const resvg = new Resvg(svg, {
    font: {
      loadSystemFonts: false,
    },
  });
  
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
