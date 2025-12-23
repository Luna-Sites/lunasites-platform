import { writeFile } from 'fs/promises';
import { join } from 'path';
import { config } from '../config/index.js';

/**
 * Generate ScreenshotOne API URL for a site
 */
function generateScreenshotOneUrl(siteId: string): string {
  const accessKey = config.screenshotone.accessKey;
  if (!accessKey) {
    throw new Error('SCREENSHOTONE_ACCESS_KEY not configured');
  }

  const siteUrl = `https://${siteId}.${config.baseDomain}`;
  const params = new URLSearchParams({
    access_key: accessKey,
    url: siteUrl,
    viewport_width: '1200',
    viewport_height: '800',
    device_scale_factor: '1',
    format: 'jpg',
    image_quality: '80',
    block_ads: 'true',
    block_cookie_banners: 'true',
    block_trackers: 'true',
  });

  return `https://api.screenshotone.com/take?${params.toString()}`;
}

/**
 * Download screenshot from ScreenshotOne and save it locally
 * Returns the public URL path to the saved screenshot
 */
export async function captureAndSaveScreenshot(siteId: string): Promise<string> {
  try {
    // Generate ScreenshotOne URL
    const screenshotUrl = generateScreenshotOneUrl(siteId);

    // Fetch the screenshot
    const response = await fetch(screenshotUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch screenshot: ${response.statusText}`);
    }

    // Get the image buffer
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Generate filename with timestamp to ensure uniqueness
    const timestamp = Date.now();
    const filename = `${siteId}-${timestamp}.jpg`;

    // Save to public/screenshots directory
    const publicDir = join(process.cwd(), '..', 'public', 'screenshots');
    const filepath = join(publicDir, filename);

    await writeFile(filepath, buffer);

    // Return the public URL path
    return `/screenshots/${filename}`;
  } catch (error) {
    console.error('Error capturing screenshot:', error);
    throw new Error('Failed to capture and save screenshot');
  }
}
