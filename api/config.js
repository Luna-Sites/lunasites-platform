/**
 * Minimal config for Nick migrations
 * Provides blobsDir for document migration
 *
 * SITE_BLOBS_DIR is set per-site during bootstrap
 * BLOBS_DIR is the base directory
 */
export const config = {
  // Use site-specific dir if set, otherwise base dir
  blobsDir: process.env.SITE_BLOBS_DIR || process.env.BLOBS_DIR || '/tmp/blobs',
};

module.exports = { config };
