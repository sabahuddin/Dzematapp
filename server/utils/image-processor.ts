import sharp from 'sharp';
import path from 'path';
import fs from 'fs/promises';

export interface ImageConfig {
  width: number;
  height: number;
  quality?: number;
  format?: 'webp' | 'jpeg' | 'png';
}

export const IMAGE_CONFIGS = {
  event: { width: 1200, height: 675, quality: 85, format: 'webp' as const },
  announcement: { width: 1200, height: 675, quality: 85, format: 'webp' as const },
  marketplace: { width: 800, height: 800, quality: 80, format: 'webp' as const },
  shop: { width: 800, height: 800, quality: 80, format: 'webp' as const },
  profile: { width: 400, height: 400, quality: 85, format: 'webp' as const },
  logo: { width: 400, height: 400, quality: 85, format: 'webp' as const },
  thumbnail: { width: 300, height: 169, quality: 75, format: 'webp' as const },
  task: { width: 1200, height: 675, quality: 85, format: 'webp' as const },
  certificate: { width: 1200, height: 800, quality: 90, format: 'webp' as const },
};

export async function processImage(
  inputBuffer: Buffer,
  config: ImageConfig
): Promise<Buffer> {
  try {
    const processed = await sharp(inputBuffer)
      .resize(config.width, config.height, {
        fit: 'cover',
        position: 'center',
      })
      .toFormat(config.format || 'webp', {
        quality: config.quality || 80,
      })
      .toBuffer();

    const originalSize = inputBuffer.length;
    const newSize = processed.length;
    const savings = Math.round((1 - newSize / originalSize) * 100);
    
    console.log(`✅ Image processed: ${config.width}x${config.height}, ${Math.round(newSize / 1024)}KB (${savings}% savings)`);
    
    return processed;
  } catch (error) {
    console.error('❌ Image processing error:', error);
    throw new Error('Failed to process image');
  }
}

export async function processAndSaveImage(
  inputBuffer: Buffer,
  outputPath: string,
  config: ImageConfig
): Promise<string> {
  try {
    const processedBuffer = await processImage(inputBuffer, config);
    
    const dir = path.dirname(outputPath);
    await fs.mkdir(dir, { recursive: true });
    
    let finalPath = outputPath;
    if (config.format === 'webp' && !outputPath.endsWith('.webp')) {
      finalPath = outputPath.replace(/\.(jpg|jpeg|png|gif|bmp)$/i, '.webp');
      if (!finalPath.endsWith('.webp')) {
        finalPath = finalPath + '.webp';
      }
    }
    
    await fs.writeFile(finalPath, processedBuffer);
    
    console.log(`✅ Image saved: ${finalPath}`);
    
    return finalPath;
  } catch (error) {
    console.error('❌ Save image error:', error);
    throw new Error('Failed to save image');
  }
}

export async function processImageToBuffer(
  inputBuffer: Buffer,
  type: keyof typeof IMAGE_CONFIGS
): Promise<Buffer> {
  const config = IMAGE_CONFIGS[type];
  return processImage(inputBuffer, config);
}

export function generateImageFilename(prefix: string, extension: string = 'webp'): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `${prefix}-${timestamp}-${random}.${extension}`;
}
