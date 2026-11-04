import { OTLPLogExporter } from "@opentelemetry/exporter-logs-otlp-http"
import { resourceFromAttributes } from "@opentelemetry/resources"
import { BatchLogRecordProcessor, LoggerProvider } from "@opentelemetry/sdk-logs"

const projectToken = process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN
const host = process.env.NEXT_PUBLIC_POSTHOG_HOST
const loggerName = "when-cac-posthog-logs"

let loggerProvider: LoggerProvider | undefined

function initializePostHogLogs() {
  if (loggerProvider) {
    return
  }

  if (!projectToken || !host) {
    if (process.env.NODE_ENV === "development") {
      const missingVariable = !projectToken
        ? "NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN"
        : "NEXT_PUBLIC_POSTHOG_HOST"

      throw new Error(
        `${missingVariable} variable required by PostHog is missing or un-configured, this causes events to be silently missed. This error stops appearing once ${missingVariable} is configured`,
      )
    }

    return
  }

  loggerProvider = new LoggerProvider({
    resource: resourceFromAttributes({ "service.name": "when-cac-frontend" }),
    processors: [
      new BatchLogRecordProcessor({
        exporter: new OTLPLogExporter({
          url: `${host.replace(/\/$/, "")}/i/v1/logs`,
          headers: {
            Authorization: `Bearer ${projectToken}`,
            "Content-Type": "application/json",
          },
        }),
      }),
    ],
  })
}

export function getPostHogLogger() {
  initializePostHogLogs()
  return loggerProvider?.getLogger(loggerName)
}

export async function flushPostHogLogs() {
  try {
    await loggerProvider?.forceFlush()
  } catch {}
}

export function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    initializePostHogLogs()
  }
}
