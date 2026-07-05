import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

/** Accepted document types across the app. */
export const ACCEPTED_MIME: Record<string, string> = {
  "application/pdf": "pdf",
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
};
export const ACCEPT_ATTR = ".pdf,.png,.jpg,.jpeg,.webp";
export const MAX_UPLOAD_BYTES = 15 * 1024 * 1024; // 15MB

const REGION = process.env.AWS_REGION || "us-east-1";
const BUCKET = process.env.S3_BUCKET_NAME || "";

/** True only when all AWS env vars are present — gates upload UI/actions. */
export function isS3Configured(): boolean {
  return Boolean(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY && BUCKET);
}

function client() {
  return new S3Client({
    region: REGION,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
  });
}

export async function presignUpload(key: string, contentType: string, expiresIn = 300) {
  return getSignedUrl(client(), new PutObjectCommand({ Bucket: BUCKET, Key: key, ContentType: contentType }), { expiresIn });
}

export async function deleteObject(key: string) {
  await client().send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }));
}

export function objectPublicUrl(key: string) {
  return `https://${BUCKET}.s3.${REGION}.amazonaws.com/${key}`;
}

/** Extract the S3 key back out of a stored public URL (for deletion). */
export function keyFromUrl(url: string): string | null {
  const prefix = `https://${BUCKET}.s3.${REGION}.amazonaws.com/`;
  return url.startsWith(prefix) ? url.slice(prefix.length) : null;
}
