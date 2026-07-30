import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"

export function SearchBar() {
  return (
    <div className="relative w-full max-w-sm">
      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-[#6B7280]" />
      <Input
        type="search"
        placeholder="Search..."
        className="w-full border-[#E5D7C5] bg-white pl-8 shadow-none transition-colors placeholder:text-[#7C8799] hover:border-[#DDBA8B] focus-visible:border-[#C97816] focus-visible:ring-[#C97816]/20 dark:border-input dark:bg-background sm:w-[300px] md:w-[200px] lg:w-[300px]"
      />
    </div>
  )
}
