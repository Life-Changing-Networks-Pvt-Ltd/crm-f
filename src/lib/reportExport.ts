import api from "@/services/api"

export async function downloadReportCsv(
  report: "sales" | "users" | "meetings",
  params: Record<string, string>,
) {
  const response = await api.get(`/reports/${report}/export`, {
    params,
    responseType: "blob",
  })
  const disposition = String(response.headers["content-disposition"] || "")
  const filename = disposition.match(/filename="?([^"]+)"?/)?.[1] || `${report}-report.csv`
  const url = window.URL.createObjectURL(response.data)
  const anchor = document.createElement("a")
  anchor.href = url
  anchor.download = filename
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  window.URL.revokeObjectURL(url)
}
