import type { EmailBlock, EmailTemplate } from "../types"

function escapeHtml(value: string) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;")
}

export function blocksToHtml(blocks: EmailBlock[]) {
  return blocks.map((block) => {
    const align = block.align || "left"
    if (block.type === "heading") return `<h1 style="margin:0 0 20px;font-family:Arial,sans-serif;font-size:30px;line-height:1.25;color:#1f2937;text-align:${align}">${escapeHtml(block.content)}</h1>`
    if (block.type === "text") return `<p style="margin:0 0 20px;font-family:Arial,sans-serif;font-size:16px;line-height:1.7;color:#4b5563;text-align:${align}">${escapeHtml(block.content).replace(/\n/g, "<br>")}</p>`
    if (block.type === "button") return `<div style="margin:24px 0;text-align:${align}"><a href="${escapeHtml(block.href || "#")}" style="display:inline-block;padding:13px 24px;border-radius:10px;background:#b86917;color:#ffffff;font-family:Arial,sans-serif;font-weight:700;text-decoration:none">${escapeHtml(block.content || "Learn more")}</a></div>`
    if (block.type === "image") return `<div style="margin:20px 0;text-align:${align}"><img src="${escapeHtml(block.content)}" alt="" style="display:inline-block;max-width:100%;height:auto;border-radius:12px"></div>`
    if (block.type === "divider") return `<hr style="margin:28px 0;border:0;border-top:1px solid #e5e7eb">`
    if (block.type === "spacer") return `<div style="height:${Math.max(8, Number(block.content) || 32)}px;line-height:1px">&nbsp;</div>`
    return ""
  }).join("")
}

export function templateToHtml(template: Pick<EmailTemplate, "htmlContent" | "blocks" | "preheader">) {
  if (template.htmlContent.trim()) return template.htmlContent
  const content = blocksToHtml(template.blocks)
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body style="margin:0;background:#f4f1ec;padding:30px 12px"><div style="display:none;max-height:0;overflow:hidden">${escapeHtml(template.preheader || "")}</div><table role="presentation" width="100%" cellspacing="0" cellpadding="0"><tr><td align="center"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:680px;background:#ffffff;border-radius:16px"><tr><td style="padding:42px">${content || '<p style="font-family:Arial,sans-serif;color:#6b7280">Start writing your email...</p>'}</td></tr></table></td></tr></table></body></html>`
}
