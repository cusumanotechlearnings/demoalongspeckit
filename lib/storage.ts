/**
 * Blob storage for Synthesis: resource and submission file uploads.
 * Uses Vercel Blob so uploads work in serverless without managing buckets.
 *
 * Why this file: Single place for put/get/delete so we can switch to S3
 * or another provider later without changing route code.
 */

import { put, del, list } from "@vercel/blob";

const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024; // 25 MB per spec "reasonable limits"

/**
 * Upload a file and return the blob URL. Used for resources (PDF, images) and
 * submission attachments (including video for storage in MVP).
 */
export async function uploadFile(
  file: File | Buffer,
  pathPrefix: string,
  options?: { contentType?: string }
): Promise<{ url: string; pathname: string }> {
  const name = `${pathPrefix}/${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  const blob = await put(name, file, {
    access: "public",
    contentType: options?.contentType,
  });
  return { url: blob.url, pathname: blob.pathname };
}

/**
 * Delete a blob by URL. Use when user deletes a resource or we prune.
 */
export async function deleteByUrl(url: string): Promise<void> {
  await del(url);
}

/**
 * List blobs under a prefix (e.g. "resources/USER_ID"). Useful for cleanup.
 */
export async function listBlobs(prefix: string): Promise<{ pathname: string; url: string }[]> {
  const { blobs } = await list({ prefix });
  return blobs.map((b) => ({ pathname: b.pathname, url: b.url }));
}

/**
 * Enforce max file size so we return a clear error before uploading (per spec).
 */
export function isWithinLimit(bytes: number): boolean {
  return bytes <= MAX_FILE_SIZE_BYTES;
}

export const MAX_FILE_SIZE_BYTES_EXPORT = MAX_FILE_SIZE_BYTES;
