import { Storage } from "@google-cloud/storage"

export type SignedUploadUrlResult = {
  bucket: string
  objectKey: string
  gcsUri: string
  url: string
  headers: Record<string, string>
  expiresAt: string
}

function requireEnv(name: string): string {
  const value = process.env[name]
  if (!value) throw new Error(`Missing env var: ${name}`)
  return value
}

export function getGcsBucketName(): string {
  return requireEnv("GCS_BUCKET")
}

export function getGcsClient(): Storage {
  return new Storage()
}

export async function createSignedUploadUrl(input: {
  bucket?: string
  objectKey: string
  contentType: string
  expiresInSeconds?: number
}): Promise<SignedUploadUrlResult> {
  const bucket = input.bucket ?? getGcsBucketName()
  const expiresInSeconds = input.expiresInSeconds ?? 10 * 60

  const storage = getGcsClient()
  const file = storage.bucket(bucket).file(input.objectKey)

  const expires = Date.now() + expiresInSeconds * 1000
  const [url] = await file.getSignedUrl({
    version: "v4",
    action: "write",
    expires,
    contentType: input.contentType,
  })

  return {
    bucket,
    objectKey: input.objectKey,
    gcsUri: `gs://${bucket}/${input.objectKey}`,
    url,
    headers: {
      "content-type": input.contentType,
    },
    expiresAt: new Date(expires).toISOString(),
  }
}
