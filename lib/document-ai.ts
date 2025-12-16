export type DocumentAiExtractResult = {
  text: string
  raw: unknown
}

function requireEnv(name: string): string {
  const value = process.env[name]
  if (!value) throw new Error(`Missing env var: ${name}`)
  return value
}

export function getDocumentAiConfig(): {
  projectId: string
  location: string
  processorId: string
} {
  // On GCP (Cloud Run/Functions), projectId can often be inferred, but we require it for clarity.
  const projectId = requireEnv("GCP_PROJECT_ID")
  const location = requireEnv("DOCUMENTAI_LOCATION")
  const processorId = requireEnv("DOCUMENTAI_PROCESSOR_ID")
  return { projectId, location, processorId }
}

export async function extractTextFromGcsWithDocumentAi(input: {
  gcsUri: string
  mimeType: string
}): Promise<DocumentAiExtractResult> {
  const { projectId, location, processorId } = getDocumentAiConfig()

  // Lazy import to keep client-side bundles clean.
  const { DocumentProcessorServiceClient } = await import("@google-cloud/documentai")

  const client = new DocumentProcessorServiceClient()
  const name = `projects/${projectId}/locations/${location}/processors/${processorId}`

  const [result] = await client.processDocument({
    name,
    rawDocument: undefined,
    inlineDocument: undefined,
    gcsDocument: {
      gcsUri: input.gcsUri,
      mimeType: input.mimeType,
    },
  })

  const doc = result.document
  const text = doc?.text ?? ""

  return {
    text,
    raw: result,
  }
}
