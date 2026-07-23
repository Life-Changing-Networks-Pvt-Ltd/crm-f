import { useState, type FormEvent } from "react"
import { Link } from "@tanstack/react-router"
import { Check, CreditCard, Mail, ReceiptText, WalletCards } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useEmailMarketingStore } from "../EmailMarketingStore"
import { EmptyPanel, MetricCard, ModulePage, PageContainer, PageHeading, StatusPill, formatDate } from "../components/PageElements"
import { getEmailMarketingPath } from "../navigation"

type BillingView = "buy" | "usage"
const packs = [{ credits: 5_000, amount: 499, label: "Starter" }, { credits: 25_000, amount: 1_999, label: "Growth", popular: true }, { credits: 100_000, amount: 6_999, label: "Scale" }]

export function BillingPage({ view }: { view: BillingView }) {
  const { billing, campaigns, automations, purchaseCredits, updateBillingProfile } = useEmailMarketingStore()
  const [selected, setSelected] = useState<number | null>(null)
  const [profile, setProfile] = useState({ billingName: billing.billingName, billingEmail: billing.billingEmail, companyName: billing.companyName, gstin: billing.gstin, address: billing.address })
  const used = campaigns.reduce((sum, item) => sum + item.metrics.sent, 0) + automations.reduce((sum, item) => sum + item.executions.length, 0)
  const confirmPurchase = async (event: FormEvent) => {
    event.preventDefault()
    const pack = packs.find((item) => item.credits === selected)
    if (!pack) return
    if (!profile.billingName || !profile.billingEmail.includes("@")) return toast.error("Add a billing name and valid email.")
    try {
      await updateBillingProfile(profile)
      await purchaseCredits(pack.credits, pack.amount)
      setSelected(null)
      toast.success("Credits added successfully")
    } catch {
      toast.error("Credit checkout is disabled until a payment gateway is configured.")
    }
  }
  return <ModulePage><PageContainer><PageHeading title="Billing & credits" description="Manage prepaid email credits, usage history, billing details, and future invoices." />
    <nav className="flex gap-2 rounded-2xl border bg-card p-2"><Button variant={view === "buy" ? "default" : "ghost"} asChild><Link to={getEmailMarketingPath("/billing/buy-credits") as never}>Buy credits</Link></Button><Button variant={view === "usage" ? "default" : "ghost"} asChild><Link to={getEmailMarketingPath("/billing/total-usage") as never}>Total usage</Link></Button></nav>
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><MetricCard label="Credit balance" value={billing.creditBalance.toLocaleString("en-IN")} helper="Available email sends" icon={<WalletCards className="h-5 w-5" />} tone="success" /><MetricCard label="Credits used" value={used.toLocaleString("en-IN")} helper="Campaign and automation usage" icon={<Mail className="h-5 w-5" />} /><MetricCard label="Purchased" value={billing.transactions.filter((item) => item.type === "purchase").reduce((sum, item) => sum + item.credits, 0).toLocaleString("en-IN")} helper="All recorded purchases" icon={<CreditCard className="h-5 w-5" />} /><MetricCard label="Transactions" value={billing.transactions.length} helper="Credit wallet activity" icon={<ReceiptText className="h-5 w-5" />} tone="muted" /></section>
    {view === "buy" ? <><section><h3 className="text-lg font-semibold">Choose a credit pack</h3><div className="mt-4 grid gap-4 md:grid-cols-3">{packs.map((pack) => <button key={pack.credits} type="button" onClick={() => setSelected(pack.credits)} className={`relative rounded-2xl border bg-card p-6 text-left transition ${selected === pack.credits ? "border-primary ring-2 ring-primary/20" : "hover:border-primary/40"}`}>{pack.popular ? <span className="absolute right-4 top-4 rounded-full bg-primary/10 px-2 py-1 text-xs font-medium text-primary">Popular</span> : null}<p className="text-sm font-medium text-primary">{pack.label}</p><p className="mt-4 text-3xl font-bold">{pack.credits.toLocaleString("en-IN")}</p><p className="text-sm text-muted-foreground">email credits</p><p className="mt-5 text-xl font-semibold">₹{pack.amount.toLocaleString("en-IN")}</p><p className="mt-1 text-xs text-muted-foreground">Taxes shown at real checkout</p>{selected === pack.credits ? <Check className="absolute bottom-5 right-5 h-5 w-5 text-primary" /> : null}</button>)}</div></section>{selected ? <form onSubmit={confirmPurchase} className="rounded-2xl border bg-card p-5 shadow-sm"><div className="flex items-center justify-between"><div><h3 className="font-semibold">Billing details</h3><p className="mt-1 text-xs text-muted-foreground">Required for future payment and invoice generation.</p></div><StatusPill status="preview" /></div><div className="mt-5 grid gap-4 md:grid-cols-2"><div><Label>Billing name</Label><Input className="mt-2" value={profile.billingName} onChange={(e) => setProfile({ ...profile, billingName: e.target.value })} required /></div><div><Label>Billing email</Label><Input className="mt-2" type="email" value={profile.billingEmail} onChange={(e) => setProfile({ ...profile, billingEmail: e.target.value })} required /></div><div><Label>Company</Label><Input className="mt-2" value={profile.companyName} onChange={(e) => setProfile({ ...profile, companyName: e.target.value })} /></div><div><Label>GSTIN</Label><Input className="mt-2" value={profile.gstin} onChange={(e) => setProfile({ ...profile, gstin: e.target.value.toUpperCase() })} maxLength={15} /></div><div className="md:col-span-2"><Label>Billing address</Label><Textarea className="mt-2" value={profile.address} onChange={(e) => setProfile({ ...profile, address: e.target.value })} /></div></div><div className="mt-5 flex justify-end gap-2"><Button type="button" variant="outline" onClick={() => setSelected(null)}>Cancel</Button><Button type="submit">Confirm local preview</Button></div></form> : null}</> : <section className="rounded-2xl border bg-card"><div className="border-b p-5"><h3 className="font-semibold">Credit transactions</h3><p className="mt-1 text-xs text-muted-foreground">Purchases and future send deductions from this wallet.</p></div>{billing.transactions.length ? <div className="divide-y">{billing.transactions.map((item) => <div key={item.id} className="grid gap-2 p-5 text-sm md:grid-cols-5"><span>{formatDate(item.createdAt)}</span><span className="font-medium capitalize">{item.type.replaceAll("_", " ")}</span><span>{item.credits.toLocaleString("en-IN")} credits</span><span>{item.amount ? `₹${item.amount.toLocaleString("en-IN")}` : "—"}</span><span className="font-medium">Balance {item.balanceAfter.toLocaleString("en-IN")}</span></div>)}</div> : <div className="p-5"><EmptyPanel title="No credit transactions" description="Credit purchases and send usage will appear here." /></div>}</section>}
    <p className="text-xs text-muted-foreground">Wallet balances and transactions are stored by the CRM backend. Credit checkout remains disabled until a payment gateway is configured.</p>
  </PageContainer></ModulePage>
}
