import { lazy, Suspense } from "react"

const EmailMarketingApp = lazy(() => import("@/features/email-marketing/EmailMarketingApp"))

export default function EmailMarketing() {
  return (
    <Suspense fallback={<EmailMarketingLoadingState />}>
      <EmailMarketingApp />
    </Suspense>
  )
}

function EmailMarketingLoadingState() {
  return (
    <div className="fixed inset-0 flex h-[100dvh] w-full bg-background" role="status" aria-label="Loading Email Marketing">
      <div className="hidden w-[19rem] border-r bg-sidebar p-4 lg:block">
        <div className="h-10 w-40 animate-pulse rounded-xl bg-muted" />
        <div className="mt-8 space-y-3">
          {Array.from({ length: 8 }).map((_, index) => (
            <div key={index} className="h-10 animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
      </div>
      <div className="flex flex-1 flex-col">
        <div className="h-16 border-b bg-background" />
        <div className="flex flex-1 items-center justify-center">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-muted border-t-primary" />
        </div>
      </div>
    </div>
  )
}
