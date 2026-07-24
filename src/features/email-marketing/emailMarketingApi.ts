import api from "@/services/api"

const BASE = "/email-marketing"

export function getEmailMarketingErrorMessage(error: unknown, fallback: string) {
  if (!error || typeof error !== "object") return fallback
  const response = (error as {
    response?: { data?: { message?: unknown } }
  }).response
  const message = response?.data?.message
  return typeof message === "string" && message.trim() ? message : fallback
}

export function normalizeServerIds<T>(value: unknown): T {
  if (Array.isArray(value)) return value.map((item) => normalizeServerIds(item)) as T
  if (!value || typeof value !== "object") return value as T
  const source = value as Record<string, unknown>
  const output: Record<string, unknown> = {}
  Object.entries(source).forEach(([key, item]) => {
    if (["workspaceId", "createdBy", "updatedBy", "__v"].includes(key)) return
    output[key === "_id" ? "id" : key] = normalizeServerIds(item)
  })
  return output as T
}

export async function emailMarketingRequest<T>(
  method: "get" | "post" | "patch" | "put" | "delete",
  path: string,
  data?: unknown,
): Promise<T> {
  const response = await api.request({
    method,
    url: `${BASE}${path}`,
    data,
  })
  return normalizeServerIds<T>(response.data?.data)
}

export async function downloadEmailMarketingReport(params: URLSearchParams) {
  const response = await api.get(`${BASE}/reports/export?${params.toString()}`, {
    responseType: "blob",
  })
  const disposition = String(response.headers["content-disposition"] || "")
  const filename = disposition.match(/filename="([^"]+)"/)?.[1] ||
    `email-marketing-report.${params.get("format") || "csv"}`
  const url = URL.createObjectURL(response.data)
  const link = document.createElement("a")
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

export async function uploadEmailMarketingImage(file: File) {
  const formData = new FormData()
  formData.append("file", file)
  const response = await api.post(`${BASE}/uploads/image/file`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  })
  return normalizeServerIds<{ id: string; url: string; originalName: string }>(
    response.data?.data,
  )
}
