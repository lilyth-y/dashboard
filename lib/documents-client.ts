export type UploadUrlResponse = {
  documentId: string
  upload: {
    url: string
    headers: Record<string, string>
    expiresAt: string
  }
  gcs: {
    bucket: string
    objectKey: string
    uri: string
  }
}

export async function requestProjectDocumentUploadUrl(input: {
  projectId: string
  filename: string
  contentType: string
  sizeBytes?: number
}): Promise<UploadUrlResponse> {
  const res = await fetch(`/api/projects/${encodeURIComponent(input.projectId)}/documents/upload-url`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      filename: input.filename,
      contentType: input.contentType,
      sizeBytes: input.sizeBytes,
    }),
  })

  const data = (await res.json()) as unknown
  if (!res.ok) {
    const message =
      typeof data === "object" && data && "error" in data && typeof (data as { error: unknown }).error === "string"
        ? String((data as { error: unknown }).error)
        : "Upload URL request failed"
    throw new Error(message)
  }

  return data as UploadUrlResponse
}

export async function uploadFileToSignedUrl(input: {
  url: string
  headers: Record<string, string>
  file: File
}): Promise<void> {
  const res = await fetch(input.url, {
    method: "PUT",
    headers: {
      ...input.headers,
      // Some browsers may not set content-type automatically for PUT
      "Content-Type": input.file.type || input.headers["content-type"] || "application/octet-stream",
    },
    body: input.file,
  })

  if (!res.ok) {
    throw new Error(`Upload failed (${res.status})`)
  }
}

export async function enqueueDocumentProcessing(documentId: string): Promise<void> {
  const res = await fetch(`/api/documents/${encodeURIComponent(documentId)}/enqueue`, {
    method: "POST",
  })

  if (!res.ok) {
    const data = (await res.json().catch(() => null)) as { error?: unknown }
    const message = (typeof data?.error === 'string' ? data.error : null) || `Enqueue failed (${res.status})`
    throw new Error(message)
  }
}

export async function uploadAndEnqueueProjectDocument(input: {
  projectId: string
  file: File
}): Promise<{ documentId: string }> {
  const upload = await requestProjectDocumentUploadUrl({
    projectId: input.projectId,
    filename: input.file.name,
    contentType: input.file.type || "application/octet-stream",
    sizeBytes: input.file.size,
  })

  await uploadFileToSignedUrl({
    url: upload.upload.url,
    headers: upload.upload.headers,
    file: input.file,
  })

  await enqueueDocumentProcessing(upload.documentId)

  return { documentId: upload.documentId }
}
