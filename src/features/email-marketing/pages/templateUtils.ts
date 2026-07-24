import type { EmailBlock, EmailTemplate } from "../types"

function escapeHtml(value: string) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;")
}

function safeUrl(value = "", image = false) {
  const candidate = value.trim()
  if (!candidate) return ""
  if (!image && candidate === "#") return "#"
  try {
    const parsed = new URL(candidate)
    if (!["http:", "https:"].includes(parsed.protocol)) return ""
    return parsed.href
  } catch {
    return ""
  }
}

export function blocksToHtml(blocks: EmailBlock[]) {
  return blocks.map((block) => {
    const align = block.align || "left"
    if (block.type === "heading") return `<h1 style="margin:0 0 20px;font-family:Arial,sans-serif;font-size:30px;line-height:1.25;color:#1f2937;text-align:${align}">${escapeHtml(block.content)}</h1>`
    if (block.type === "text") return `<p style="margin:0 0 20px;font-family:Arial,sans-serif;font-size:16px;line-height:1.7;color:#4b5563;text-align:${align}">${escapeHtml(block.content).replace(/\n/g, "<br>")}</p>`
    if (block.type === "button") return `<div style="margin:24px 0;text-align:${align}"><a href="${escapeHtml(safeUrl(block.href || "#") || "#")}" style="display:inline-block;padding:13px 24px;border-radius:10px;background:#b86917;color:#ffffff;font-family:Arial,sans-serif;font-weight:700;text-decoration:none">${escapeHtml(block.content || "Learn more")}</a></div>`
    if (block.type === "image") {
      const source = safeUrl(block.content, true)
      return source ? `<div style="margin:20px 0;text-align:${align}"><img src="${escapeHtml(source)}" alt="${escapeHtml(block.alt || "")}" style="display:inline-block;max-width:100%;height:auto;border-radius:12px"></div>` : ""
    }
    if (block.type === "video") {
      const href = safeUrl(block.href || "#") || "#"
      const source = safeUrl(block.content, true)
      return `<div style="margin:24px 0;text-align:${align}"><a href="${escapeHtml(href)}" style="display:inline-block;position:relative;text-decoration:none">${source ? `<img src="${escapeHtml(source)}" alt="${escapeHtml(block.alt || "Watch video")}" style="display:block;max-width:100%;height:auto;border-radius:12px">` : ""}<span style="display:inline-block;margin-top:${source ? "-54px" : "0"};padding:12px 18px;border-radius:999px;background:#b86917;color:#fff;font-family:Arial,sans-serif;font-weight:700">▶ Watch video</span></a></div>`
    }
    if (block.type === "dynamic") return `<p style="margin:0 0 20px;font-family:Arial,sans-serif;font-size:16px;line-height:1.7;color:#4b5563;text-align:${align}">${escapeHtml(block.content || "{{first_name}}")}</p>`
    if (block.type === "logo") {
      const source = safeUrl(block.content, true)
      if (!source) return ""
      const image = `<img src="${escapeHtml(source)}" alt="${escapeHtml(block.alt || "Logo")}" style="display:inline-block;max-width:220px;max-height:100px;height:auto">`
      const href = safeUrl(block.href || "")
      return `<div style="margin:16px 0;text-align:${align}">${href ? `<a href="${escapeHtml(href)}">${image}</a>` : image}</div>`
    }
    if (block.type === "social") {
      const links = (block.items || []).map((item) => {
        const href = safeUrl(item.url)
        return href ? `<a href="${escapeHtml(href)}" style="display:inline-block;margin:4px 8px;color:#b86917;font-family:Arial,sans-serif;font-weight:700;text-decoration:none">${escapeHtml(item.label)}</a>` : ""
      }).join("")
      return `<div style="margin:20px 0;text-align:${align}">${links}</div>`
    }
    if (block.type === "html") return block.content
    if (block.type === "divider") return `<hr style="margin:28px 0;border:0;border-top:1px solid #e5e7eb">`
    if (block.type === "product") {
      const source = safeUrl(block.imageUrl || "", true)
      const href = safeUrl(block.href || "#") || "#"
      return `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:24px 0;border:1px solid #e5e7eb;border-radius:12px"><tr>${source ? `<td width="180" style="padding:16px"><img src="${escapeHtml(source)}" alt="${escapeHtml(block.alt || block.content)}" style="display:block;max-width:180px;width:100%;height:auto;border-radius:8px"></td>` : ""}<td style="padding:20px;font-family:Arial,sans-serif"><h2 style="margin:0 0 8px;color:#1f2937;font-size:22px">${escapeHtml(block.content || "Product name")}</h2><p style="margin:0 0 10px;color:#6b7280;line-height:1.5">${escapeHtml(block.subtitle || "")}</p>${block.price ? `<p style="margin:0 0 14px;color:#1f2937;font-weight:700">${escapeHtml(block.price)}</p>` : ""}<a href="${escapeHtml(href)}" style="display:inline-block;padding:10px 16px;border-radius:8px;background:#b86917;color:#fff;font-weight:700;text-decoration:none">${escapeHtml(block.buttonText || "View product")}</a></td></tr></table>`
    }
    if (block.type === "navigation") {
      const links = (block.items || []).map((item) => {
        const href = safeUrl(item.url || "#") || "#"
        return `<a href="${escapeHtml(href)}" style="display:inline-block;margin:4px 12px;color:#374151;font-family:Arial,sans-serif;font-weight:600;text-decoration:none">${escapeHtml(item.label)}</a>`
      }).join("")
      return `<nav style="margin:18px 0;text-align:${align}">${links}</nav>`
    }
    if (block.type === "spacer") return `<div style="height:${Math.min(500, Math.max(8, Number(block.content) || 32))}px;line-height:1px">&nbsp;</div>`
    return ""
  }).join("")
}

export function templateToHtml(template: Pick<EmailTemplate, "htmlContent" | "blocks" | "preheader">) {
  if (template.htmlContent.trim()) return template.htmlContent
  const content = blocksToHtml(template.blocks)
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body style="margin:0;background:#f4f1ec;padding:30px 12px"><div style="display:none;max-height:0;overflow:hidden">${escapeHtml(template.preheader || "")}</div><table role="presentation" width="100%" cellspacing="0" cellpadding="0"><tr><td align="center"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:680px;background:#ffffff;border-radius:16px"><tr><td style="padding:42px">${content || '<p style="font-family:Arial,sans-serif;color:#6b7280">Start writing your email...</p>'}</td></tr></table></td></tr></table></body></html>`
}
