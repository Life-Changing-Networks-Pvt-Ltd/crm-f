import { useLocation, Link } from "@tanstack/react-router"
import { ChevronRight, Home } from "lucide-react"

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"

export function Breadcrumbs() {
  const location = useLocation()
  const pathnames = location.pathname.split("/").filter((x) => x)

  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link
              to="/"
              className="flex items-center text-[#C97816] transition-colors hover:text-[#A95F0B]"
            >
              <Home className="h-4 w-4" />
            </Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
        
        {pathnames.length > 0 && <BreadcrumbSeparator><ChevronRight className="h-4 w-4" /></BreadcrumbSeparator>}
        
        {pathnames.map((value, index) => {
          const isLast = index === pathnames.length - 1
          const to = `/${pathnames.slice(0, index + 1).join("/")}`
          const title = to === "/reports/dashboard"
            ? "Business Overview"
            : value.charAt(0).toUpperCase() + value.slice(1)

          return (
            <div key={to} className="flex items-center">
              <BreadcrumbItem>
                {isLast ? (
                  <BreadcrumbPage className="font-medium text-[#1F2937] dark:text-foreground">{title}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink asChild>
                    <Link to={to as any} className="transition-colors hover:text-[#C97816]">{title}</Link>
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
              {!isLast && <BreadcrumbSeparator><ChevronRight className="h-4 w-4" /></BreadcrumbSeparator>}
            </div>
          )
        })}
      </BreadcrumbList>
    </Breadcrumb>
  )
}
