import { Link } from "@tanstack/react-router"
import { ArrowLeft, ArrowRight, Mail, Plus, Repeat2, Sparkles } from "lucide-react"

import { Button } from "@/components/ui/button"
import { ModulePage, PageContainer, PageHeading } from "../components/PageElements"
import { campaignPresets, dripCampaignPresets } from "../data/campaignPresets"
import { getEmailMarketingPath } from "../navigation"

export function CampaignChoicePage({ drip = false }: { drip?: boolean }) {
  const presets = drip ? dripCampaignPresets : campaignPresets
  const basePath = drip ? "/campaigns/drip/new" : "/campaigns/new"
  return <ModulePage><PageContainer><PageHeading title={drip ? "Create drip campaign" : "Create campaign"} description={drip ? "Choose a ready-made lifecycle sequence or build a drip flow from scratch." : "Choose a ready-made campaign or start with a blank setup."} actions={<Button variant="outline" asChild><Link to={getEmailMarketingPath("/campaigns") as never}><ArrowLeft className="mr-2 h-4 w-4" />All campaigns</Link></Button>} />
    <section><div className="flex items-center gap-2"><Sparkles className="h-5 w-5 text-primary" /><h3 className="font-semibold">Ready-to-use {drip ? "drip flows" : "campaigns"}</h3></div><div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">{presets.map((preset) => <Link key={preset.key} to={getEmailMarketingPath(`${basePath}/${preset.key}`) as never} className="group rounded-2xl border bg-card p-5 shadow-sm transition hover:border-primary/40 hover:shadow-md"><div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">{drip ? <Repeat2 className="h-5 w-5" /> : <Mail className="h-5 w-5" />}</div><h4 className="mt-4 font-semibold group-hover:text-primary">{preset.label}</h4><p className="mt-2 min-h-12 text-sm leading-6 text-muted-foreground">{preset.description}</p><div className="mt-4 flex items-center justify-between text-xs"><span className="capitalize text-muted-foreground">Goal: {preset.goal}</span><ArrowRight className="h-4 w-4 text-primary transition group-hover:translate-x-1" /></div></Link>)}</div></section>
    <Link to={getEmailMarketingPath(basePath) as never} className="flex flex-col items-start justify-between gap-4 rounded-2xl border border-dashed bg-card p-6 transition hover:border-primary/50 hover:bg-primary/5 sm:flex-row sm:items-center"><div><div className="flex items-center gap-2"><Plus className="h-5 w-5 text-primary" /><h3 className="font-semibold">Create {drip ? "drip campaign" : "campaign"} from scratch</h3></div><p className="mt-2 text-sm text-muted-foreground">Choose the campaign type, content, audience, sender, and schedule yourself.</p></div><Button>Open builder<ArrowRight className="ml-2 h-4 w-4" /></Button></Link>
  </PageContainer></ModulePage>
}
