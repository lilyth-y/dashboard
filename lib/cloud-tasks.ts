import { CloudTasksClient } from "@google-cloud/tasks"

export type EnqueueDocumentProcessResult = {
  taskName: string
  scheduleTime?: string
}

function requireEnv(name: string): string {
  const value = process.env[name]
  if (!value) throw new Error(`Missing env var: ${name}`)
  return value
}

export function getCloudTasksConfig(): {
  projectId: string
  location: string
  queue: string
  serviceAccountEmail: string
  processorUrl: string
  audience?: string
} {
  return {
    projectId: requireEnv("GCP_PROJECT_ID"),
    location: requireEnv("CLOUD_TASKS_LOCATION"),
    queue: requireEnv("CLOUD_TASKS_QUEUE"),
    serviceAccountEmail: requireEnv("CLOUD_TASKS_SERVICE_ACCOUNT_EMAIL"),
    processorUrl: requireEnv("DOCUMENT_PROCESSOR_URL"),
    audience: process.env.CLOUD_TASKS_OIDC_AUDIENCE,
  }
}

export function getCloudTasksClient(): CloudTasksClient {
  return new CloudTasksClient()
}

export async function enqueueDocumentProcess(documentId: string): Promise<EnqueueDocumentProcessResult> {
  const cfg = getCloudTasksConfig()
  const client = getCloudTasksClient()

  const parent = client.queuePath(cfg.projectId, cfg.location, cfg.queue)
  const url = `${cfg.processorUrl.replace(/\/$/, "")}/api/internal/documents/${documentId}/process`

  const payload = Buffer.from(JSON.stringify({ documentId }))

  const [task] = await client.createTask({
    parent,
    task: {
      httpRequest: {
        httpMethod: "POST",
        url,
        headers: {
          "Content-Type": "application/json",
        },
        body: payload,
        oidcToken: {
          serviceAccountEmail: cfg.serviceAccountEmail,
          ...(cfg.audience ? { audience: cfg.audience } : {}),
        },
      },
    },
  })

  return {
    taskName: task.name ?? "",
    scheduleTime: task.scheduleTime
      ? new Date(Number(task.scheduleTime.seconds) * 1000).toISOString()
      : undefined,
  }
}
