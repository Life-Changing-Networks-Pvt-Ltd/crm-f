import { useEffect, useState } from "react"
import { useSelector } from "react-redux"
import { Check, ChevronDown, Loader2, Phone, Search, ShoppingCart } from "lucide-react"
import type { RootState } from "@/store"
import { PageHeader } from "@/components/layout/PageHeader"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import api from "@/services/api"
import { toast } from "sonner"
import Swal from "sweetalert2"
import { isAdmin } from "@/lib/accessControl"

type PlivoNumber = {
  number: string
  country_iso?: string
  type?: string
  monthly_rental_rate?: string
  services?: string[] | Record<string, boolean>
  setup_rate?: string
}

type PricingInfo = { sourceCurrency: string; displayCurrency: string; exchangeRate: number; conversionAvailable: boolean }
type SearchMeta = { limit: number; offset: number; total_count: number; next?: string | null }

const displayNumber = (number: string) => number.startsWith("+") ? number : `+${number}`

const countries = [
  ["US", "United States", "+1"], ["IN", "India", "+91"], ["CA", "Canada", "+1"],
  ["GB", "United Kingdom", "+44"], ["AU", "Australia", "+61"], ["NZ", "New Zealand", "+64"],
  ["SG", "Singapore", "+65"], ["AE", "United Arab Emirates", "+971"], ["SA", "Saudi Arabia", "+966"],
  ["DE", "Germany", "+49"], ["FR", "France", "+33"], ["ES", "Spain", "+34"],
  ["IT", "Italy", "+39"], ["NL", "Netherlands", "+31"], ["BE", "Belgium", "+32"],
  ["AT", "Austria", "+43"], ["CH", "Switzerland", "+41"], ["SE", "Sweden", "+46"],
  ["NO", "Norway", "+47"], ["DK", "Denmark", "+45"], ["FI", "Finland", "+358"],
  ["IE", "Ireland", "+353"], ["PT", "Portugal", "+351"], ["PL", "Poland", "+48"],
  ["CZ", "Czech Republic", "+420"], ["HU", "Hungary", "+36"], ["RO", "Romania", "+40"],
  ["GR", "Greece", "+30"], ["BR", "Brazil", "+55"], ["MX", "Mexico", "+52"],
  ["AR", "Argentina", "+54"], ["CL", "Chile", "+56"], ["CO", "Colombia", "+57"],
  ["PE", "Peru", "+51"], ["ZA", "South Africa", "+27"], ["NG", "Nigeria", "+234"],
  ["KE", "Kenya", "+254"], ["EG", "Egypt", "+20"], ["IL", "Israel", "+972"],
  ["TR", "Turkey", "+90"], ["JP", "Japan", "+81"], ["KR", "South Korea", "+82"],
  ["CN", "China", "+86"], ["HK", "Hong Kong", "+852"], ["MY", "Malaysia", "+60"],
  ["ID", "Indonesia", "+62"], ["PH", "Philippines", "+63"], ["TH", "Thailand", "+66"],
  ["VN", "Vietnam", "+84"], ["PK", "Pakistan", "+92"], ["BD", "Bangladesh", "+880"],
  ["LK", "Sri Lanka", "+94"], ["NP", "Nepal", "+977"], ["QA", "Qatar", "+974"],
] as const

const flag = (iso: string) => String.fromCodePoint(...iso.toUpperCase().split("").map((letter) => 127397 + letter.charCodeAt(0)))

const countryCurrencies: Record<string, string> = {
  US: "USD", IN: "INR", CA: "CAD", GB: "GBP", AU: "AUD", NZ: "NZD", SG: "SGD", AE: "AED", SA: "SAR",
  DE: "EUR", FR: "EUR", ES: "EUR", IT: "EUR", NL: "EUR", BE: "EUR", AT: "EUR", CH: "CHF", SE: "SEK",
  NO: "NOK", DK: "DKK", FI: "EUR", IE: "EUR", PT: "EUR", PL: "PLN", CZ: "CZK", HU: "HUF", RO: "RON",
  GR: "EUR", BR: "BRL", MX: "MXN", AR: "ARS", CL: "CLP", CO: "COP", PE: "PEN", ZA: "ZAR", NG: "NGN",
  KE: "KES", EG: "EGP", IL: "ILS", TR: "TRY", JP: "JPY", KR: "KRW", CN: "CNY", HK: "HKD", MY: "MYR",
  ID: "IDR", PH: "PHP", TH: "THB", VN: "VND", PK: "PKR", BD: "BDT", LK: "LKR", NP: "NPR", QA: "QAR",
}

export default function Calling() {
  const currentUser = useSelector((state: RootState) => state.auth.user)
  const adminUser = isAdmin(currentUser)
  const [owned, setOwned] = useState<PlivoNumber[]>([])
  const [available, setAvailable] = useState<PlivoNumber[]>([])
  const [activeNumbers, setActiveNumbers] = useState<string[]>([])
  const [savedActiveNumbers, setSavedActiveNumbers] = useState<string[]>([])
  const [savingPool, setSavingPool] = useState(false)
  const [country, setCountry] = useState("US")
  const [countrySearch, setCountrySearch] = useState("")
  const [type, setType] = useState("local")
  const [prefix, setPrefix] = useState("")
  const [loading, setLoading] = useState(true)
  const [searching, setSearching] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [busyNumber, setBusyNumber] = useState("")
  const [pricing, setPricing] = useState<PricingInfo>({ sourceCurrency: "USD", displayCurrency: "USD", exchangeRate: 1, conversionAvailable: true })
  const [searchMeta, setSearchMeta] = useState<SearchMeta | null>(null)
  const selectedCountry = countries.find(([iso]) => iso === country) || countries[0]
  const filteredCountries = countries.filter(([iso, name, dial]) => `${name} ${iso} ${dial}`.toLowerCase().includes(countrySearch.toLowerCase().trim()))

  const loadOwned = async () => {
    try {
      const response = await api.get("/telephony/numbers")
      setOwned(response.data.data.numbers || [])
      const configuredNumbers = response.data.data.activeNumbers
        || (response.data.data.selectedNumber ? [response.data.data.selectedNumber] : [])
      setActiveNumbers(configuredNumbers)
      setSavedActiveNumbers(configuredNumbers)
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Unable to connect to Plivo")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadOwned() }, [])

  const search = async (loadMore = false) => {
    try {
      if (loadMore) setLoadingMore(true); else setSearching(true)
      const currency = countryCurrencies[country] || "USD"
      const offset = loadMore ? (searchMeta?.offset || 0) + (searchMeta?.limit || 20) : 0
      const response = await api.get("/telephony/numbers/search", { params: { country, type, prefix, currency, offset } })
      const result = response.data.data || {}
      setAvailable((current) => loadMore ? [...current, ...(result.numbers || [])] : (result.numbers || []))
      setSearchMeta(result.meta || null)
      setPricing(result.pricing || { sourceCurrency: "USD", displayCurrency: currency, exchangeRate: 1, conversionAvailable: false })
      if (!loadMore && !(result.numbers || []).length) toast.info(prefix ? "No voice numbers available with this prefix" : "No voice numbers found for these filters")
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Number search failed")
    } finally { setSearching(false); setLoadingMore(false) }
  }

  const buy = async (number: string) => {
    const item = available.find((candidate) => candidate.number === number)
    const monthlyLocal = formatLocalPrice(item?.monthly_rental_rate)
    const setupLocal = formatLocalPrice(item?.setup_rate)
    const confirmation = await Swal.fire({
      title: "Buy virtual number?",
      html: `<div style="text-align:left"><p><strong>Number:</strong> ${displayNumber(number)}</p><p><strong>Monthly rental:</strong> ${monthlyLocal} ($${Number(item?.monthly_rental_rate || 0).toFixed(2)} USD)</p><p><strong>One-time setup:</strong> ${setupLocal} ($${Number(item?.setup_rate || 0).toFixed(2)} USD)</p><p style="margin-top:12px;font-size:12px;opacity:.7">Plivo bills in USD. Local currency is an estimated conversion.</p></div>`,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Yes, buy number",
      cancelButtonText: "Cancel",
      confirmButtonColor: "hsl(var(--primary))",
      reverseButtons: true,
    })
    if (!confirmation.isConfirmed) return
    try {
      setBusyNumber(number)
      await api.post("/telephony/numbers/buy", { number })
      setAvailable((items) => items.filter((item) => item.number !== number))
      await loadOwned()
      await Swal.fire({ title: "Number purchased", text: `${displayNumber(number)} is now available in your CRM.`, icon: "success", confirmButtonText: "Done" })
    } catch (error: any) {
      await Swal.fire({ title: "Purchase failed", text: error.response?.data?.message || "Plivo could not purchase this number", icon: "error" })
    } finally { setBusyNumber("") }
  }

  const toggleActiveNumber = (number: string) => {
    const normalized = displayNumber(number)
    setActiveNumbers((current) => current.includes(normalized)
      ? current.filter((item) => item !== normalized)
      : [...current, normalized])
  }

  const saveActivePool = async () => {
    if (activeNumbers.length === 0) {
      const confirmation = await Swal.fire({
        title: "Disable all calling numbers?",
        text: "New CRM calls will stop until an administrator activates at least one number. Existing call history and recordings will remain available.",
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Yes, Disable All",
        cancelButtonText: "Cancel",
        confirmButtonColor: "#d33",
      })
      if (!confirmation.isConfirmed) return
    }
    try {
      setSavingPool(true)
      const response = await api.put("/telephony/numbers/active-pool", { numbers: activeNumbers })
      const saved = response.data.data.activeNumbers || []
      setActiveNumbers(saved)
      setSavedActiveNumbers(saved)
      toast.success("Active calling pool updated")
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Could not update the active calling pool")
    } finally {
      setSavingPool(false)
    }
  }

  const poolChanged = [...activeNumbers].sort().join("|") !== [...savedActiveNumbers].sort().join("|")

  const formatLocalPrice = (usdValue?: string) => {
    const usd = Number(usdValue)
    if (!Number.isFinite(usd)) return "See Plivo"
    if (!pricing.conversionAvailable) return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(usd)
    return new Intl.NumberFormat(undefined, { style: "currency", currency: pricing.displayCurrency, maximumFractionDigits: 2 }).format(usd * pricing.exchangeRate)
  }

  return (
    <div className="flex flex-col gap-6 pb-8">
      <PageHeader title="Calling" description="Buy and manage Plivo virtual numbers used for CRM click-to-call." />
      <Alert>
        <Phone className="h-4 w-4" />
        <AlertTitle>How click-to-call works</AlertTitle>
        <AlertDescription>Each CRM call automatically uses the next number from the administrator-selected Active Calling Pool. Browser calls connect the employee directly to the lead.</AlertDescription>
      </Alert>

      <Card>
        <CardHeader className="gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle>Your virtual numbers</CardTitle>
            <CardDescription>{adminUser ? "Select one or more numbers for the Active Calling Pool." : "Numbers currently enabled by your administrator for CRM calls."}</CardDescription>
          </div>
          {adminUser && (
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline">{activeNumbers.length} selected</Badge>
              <Button variant="outline" size="sm" onClick={() => setActiveNumbers(owned.map((item) => displayNumber(item.number)))} disabled={owned.length === 0}>Select All</Button>
              <Button variant="outline" size="sm" onClick={() => setActiveNumbers([])} disabled={activeNumbers.length === 0}>Clear</Button>
              <Button size="sm" onClick={saveActivePool} disabled={!poolChanged || savingPool}>
                {savingPool && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Active Pool
              </Button>
            </div>
          )}
        </CardHeader>
        <CardContent>
          {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : owned.length === 0 ? (
            <p className="text-sm text-muted-foreground">No Plivo numbers purchased yet. Search below to buy one.</p>
          ) : (
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {owned.map((item) => {
                const number = displayNumber(item.number)
                const selectedForPool = activeNumbers.includes(number)
                const currentlyActive = savedActiveNumbers.includes(number)
                return <div key={item.number} className={`rounded-lg border p-4 ${selectedForPool ? "border-primary bg-primary/5" : ""}`}>
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      {adminUser && <Checkbox checked={selectedForPool} onCheckedChange={() => toggleActiveNumber(number)} aria-label={`Use ${number} in the active calling pool`} />}
                      <span className="truncate font-semibold">{number}</span>
                    </div>
                    {currentlyActive && <Badge><Check className="mr-1 h-3 w-3" />Active</Badge>}
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{item.country_iso || ""} {item.type ? `· ${item.type}` : ""}</p>
                </div>
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {adminUser && <Card>
        <CardHeader><CardTitle>Buy a virtual number</CardTitle><CardDescription>Availability, pricing, and compliance are returned by your Sellerslogin account.</CardDescription></CardHeader>
        <CardContent className="space-y-5">
          <div className="grid items-start gap-4 md:grid-cols-4">
            <div className="space-y-2">
              <Label>Country</Label>
              <DropdownMenu onOpenChange={(open) => { if (!open) setCountrySearch("") }}>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="w-full justify-between px-3 font-normal">
                    <span className="flex min-w-0 items-center gap-2"><span className="text-lg">{flag(selectedCountry[0])}</span><span className="truncate">{selectedCountry[1]}</span><span className="text-muted-foreground">{selectedCountry[2]}</span></span>
                    <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-[var(--radix-dropdown-menu-trigger-width)] p-1">
                  <div className="relative p-1" onKeyDown={(event) => event.stopPropagation()}>
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input autoFocus value={countrySearch} onChange={(event) => setCountrySearch(event.target.value)} placeholder="Search country or code..." className="pl-8" />
                  </div>
                  <div className="max-h-64 overflow-y-auto">
                    {filteredCountries.length === 0 ? <p className="px-3 py-4 text-center text-sm text-muted-foreground">No country found</p> : filteredCountries.map(([iso, name, dial]) => (
                      <DropdownMenuItem key={iso} className="gap-2" onSelect={() => { setCountry(iso); setAvailable([]); setPrefix("") }}>
                        <span className="text-lg">{flag(iso)}</span><span className="min-w-0 flex-1 truncate">{name}</span><span className="text-xs text-muted-foreground">{iso} · {dial}</span>{country === iso && <Check className="h-4 w-4" />}
                      </DropdownMenuItem>
                    ))}
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <div className="space-y-2"><Label>Number type</Label><Select value={type} onValueChange={setType}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="local">Local</SelectItem><SelectItem value="tollfree">Toll-free</SelectItem><SelectItem value="mobile">Mobile</SelectItem></SelectContent></Select></div>
            <div className="space-y-2"><Label>Prefix (optional)</Label><Input value={prefix} onChange={(event) => setPrefix(event.target.value.replace(/\D/g, ""))} placeholder={country === "IN" ? "080 or 80" : "415"} /><p className="text-xs text-muted-foreground md:absolute">Area code only; leading 0 is handled automatically.</p></div>
            <div className="space-y-2"><Label className="invisible">Search</Label><Button className="w-full" onClick={() => search(false)} disabled={searching || country.length !== 2}>{searching ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}Search numbers</Button></div>
          </div>
          {available.length > 0 && <div className="space-y-3"><div className="flex items-center justify-between gap-3 text-xs text-muted-foreground"><p>Local-currency amounts are live estimates. Plivo bills your account in USD.</p><p className="shrink-0">Showing {available.length}{searchMeta?.total_count ? ` of ${searchMeta.total_count}` : ""}</p></div><div className="rounded-md border"><Table><TableHeader><TableRow><TableHead>Number</TableHead><TableHead>Country</TableHead><TableHead>Type</TableHead><TableHead>Monthly rental</TableHead><TableHead className="text-right">Action</TableHead></TableRow></TableHeader><TableBody>{available.map((item) => <TableRow key={item.number}><TableCell className="font-medium">{displayNumber(item.number)}</TableCell><TableCell>{item.country_iso || country}</TableCell><TableCell className="capitalize">{item.type || type}</TableCell><TableCell><div className="font-medium">{formatLocalPrice(item.monthly_rental_rate)}</div>{pricing.displayCurrency !== "USD" && <div className="text-xs text-muted-foreground">${Number(item.monthly_rental_rate || 0).toFixed(2)} USD</div>}</TableCell><TableCell className="text-right"><Button size="sm" onClick={() => buy(item.number)} disabled={busyNumber === item.number}>{busyNumber === item.number ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShoppingCart className="mr-2 h-4 w-4" />}Buy</Button></TableCell></TableRow>)}</TableBody></Table></div>{searchMeta?.next && <div className="flex justify-center"><Button variant="outline" onClick={() => search(true)} disabled={loadingMore}>{loadingMore && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Load more numbers</Button></div>}</div>}
        </CardContent>
      </Card>}
    </div>
  )
}
