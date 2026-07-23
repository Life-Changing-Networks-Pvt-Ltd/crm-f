import { Link } from "@tanstack/react-router"
import { ArrowRight, Mail, Repeat2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { campaignPresets, dripCampaignPresets } from "../data/campaignPresets"
import { getEmailMarketingPath } from "../navigation"

interface CampaignPresetDialogProps {
  open: boolean
  drip?: boolean
  onOpenChange: (open: boolean) => void
}

export function CampaignPresetDialog({
  open,
  drip = false,
  onOpenChange,
}: CampaignPresetDialogProps) {
  const presets = drip ? dripCampaignPresets : campaignPresets
  const basePath = drip ? "/campaigns/drip/new" : "/campaigns/new"

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[calc(100dvh-2rem)] max-w-5xl flex-col gap-0 overflow-hidden rounded-3xl border bg-background p-0 shadow-2xl">
        <DialogHeader className="shrink-0 border-b bg-card px-5 py-4 pr-28 md:px-6">
          <DialogTitle className="text-xl">
            {drip ? "Create drip campaign" : "Create campaign"}
          </DialogTitle>
          <DialogDescription className="mt-1 text-sm">
            {drip
              ? "Pick a ready-to-use drip campaign or start a drip campaign from scratch."
              : "Pick a ready-to-use campaign or create a campaign from scratch."}
          </DialogDescription>
          <DialogClose asChild>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="absolute right-12 top-3 hidden sm:inline-flex"
            >
              Close
            </Button>
          </DialogClose>
        </DialogHeader>

        <div className="grid min-h-0 flex-1 gap-4 overflow-y-auto overscroll-contain p-4 md:p-5 lg:grid-cols-[minmax(0,1.65fr)_minmax(250px,0.7fr)]">
          <section className="rounded-2xl border bg-card p-4">
            <h3 className="text-sm font-semibold">
              {drip ? "Ready to use drip campaign" : "Ready to use campaign"}
            </h3>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">
              Select a starter campaign, then edit the details before saving.
            </p>

            <div className="mt-3 grid gap-3 md:grid-cols-2">
              {presets.map((preset) => (
                <Link
                  key={preset.key}
                  to={getEmailMarketingPath(`${basePath}/${preset.key}`) as never}
                  className="group rounded-xl border bg-background p-3.5 transition hover:border-primary/50 hover:bg-primary/5 hover:shadow-sm"
                >
                  <div className="flex items-start gap-3">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      {drip ? (
                        <Repeat2 className="h-4 w-4" />
                      ) : (
                        <Mail className="h-4 w-4" />
                      )}
                    </span>
                    <div className="min-w-0">
                      <h4 className="text-sm font-semibold group-hover:text-primary">
                        {preset.label}
                      </h4>
                      <p className="mt-1.5 text-xs leading-5 text-muted-foreground">
                        {preset.description}
                      </p>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-primary">
                      Goal: {preset.goal}
                    </span>
                    <ArrowRight className="h-3.5 w-3.5 text-primary transition group-hover:translate-x-1" />
                  </div>
                </Link>
              ))}
            </div>
          </section>

          <section className="flex flex-col items-start rounded-2xl border bg-card p-4 lg:sticky lg:top-0 lg:self-start">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              {drip ? (
                <Repeat2 className="h-4 w-4" />
              ) : (
                <Mail className="h-4 w-4" />
              )}
            </span>
            <h3 className="mt-4 text-base font-semibold">
              {drip ? "Create drip campaign from scratch" : "Create from scratch"}
            </h3>
            <p className="mt-2 text-xs leading-5 text-muted-foreground">
              Open the builder with a blank setup and choose the campaign type,
              audience, template, sender, and schedule yourself.
            </p>
            <Button size="sm" className="mt-5" asChild>
              <Link to={getEmailMarketingPath(basePath) as never}>
                Open builder
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </section>
        </div>
      </DialogContent>
    </Dialog>
  )
}
