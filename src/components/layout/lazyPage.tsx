import {
  Component,
  lazy,
  Suspense,
  type ComponentType,
  type ErrorInfo,
  type ReactNode,
} from "react"
import { Button } from "@/components/ui/button"
import { RouteLoadingFallback } from "./RouteLoadingFallback"

type PageModule = { default: ComponentType }
type PageLoader = () => Promise<PageModule>

class LazyPageErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Failed to load route chunk", error, info)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-[50vh] items-center justify-center p-6">
          <div className="max-w-md space-y-4 text-center">
            <h2 className="text-xl font-semibold">This page could not be loaded</h2>
            <p className="text-sm text-muted-foreground">
              Please retry. Your current data and permissions have not been changed.
            </p>
            <Button onClick={() => window.location.reload()}>Retry</Button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export function lazyPage(loader: PageLoader) {
  const LazyComponent = lazy(loader)

  return function LazyPage() {
    return (
      <LazyPageErrorBoundary>
        <Suspense fallback={<RouteLoadingFallback />}>
          <LazyComponent />
        </Suspense>
      </LazyPageErrorBoundary>
    )
  }
}
