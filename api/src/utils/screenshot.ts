import { config } from '../config/index.js';

/**
 * Generate ScreenshotOne URL for a site
 * Returns the URL directly - ScreenshotOne caches screenshots on their CDN
 */
export function generateScreenshotUrl(siteId: string): string {
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
    full_page: 'true', // Capture full page height, not just viewport
    device_scale_factor: '1',
    format: 'jpg',
    image_quality: '80',
    block_ads: 'true',
    block_cookie_banners: 'true',
    block_trackers: 'true',
    cache: 'true',
    cache_ttl: '86400', // 24 hours cache
  });

  return `https://api.screenshotone.com/take?${params.toString()}`;
}
