import api from "@/services/api"

export const leadSummaryQueryKey = (leadType: string, leadId: string) => [
  "lead-detail",
  leadType,
  leadId,
] as const

export const leadSummaryQueryOptions = (leadType: string, leadId: string) => ({
  queryKey: leadSummaryQueryKey(leadType, leadId),
  staleTime: 5 * 60_000,
  gcTime: 30 * 60_000,
  queryFn: async ({ signal }: { signal?: AbortSignal }) => {
    const response = await api.get(`/leads/unified/${leadType}/${leadId}`, {
      params: { summary: true },
      signal,
    })
    return response.data.data
  },
})
