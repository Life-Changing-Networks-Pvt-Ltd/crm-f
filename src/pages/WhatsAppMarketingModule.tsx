// @ts-nocheck
import { store } from '@/store'
import WhatsAppMarketingApp from '@whatsapp/App'
import '@whatsapp/index.css'

const WHATSAPP_AUTH_STORAGE_KEY = 'whatsapp_auth_user'

function getWhatsAppPageAccess(crmUser: any): string[] {
  if (crmUser.role === 'admin' || crmUser.grants?.includes('*')) return []

  const grants = new Set(crmUser.grants || [])
  const access = new Set<string>()
  if (grants.has('whatsapp.module.view')) access.add('dashboard')
  if (
    grants.has('whatsapp.templates.create')
    || grants.has('whatsapp.templates.edit')
  ) access.add('templates')
  if (grants.has('whatsapp.campaigns.manage')) access.add('broadcast')
  if (
    grants.has('whatsapp.templates.use')
    || grants.has('whatsapp.send.lead')
  ) access.add('inbox')

  // Existing WhatsApp page IDs continue to work during migration.
  for (const permission of crmUser.permissions || []) {
    if (!String(permission).startsWith('/')) access.add(permission)
  }
  return Array.from(access)
}

function syncCrmUserIntoWhatsAppSession() {
  const crmUser = store.getState().auth.user
  if (!crmUser || typeof window === 'undefined') return
  const role = ['admin', 'superadmin', 'super_admin'].includes(
    String(crmUser.role || '').toLowerCase()
  ) ? 'admin' : 'user'

  sessionStorage.setItem(WHATSAPP_AUTH_STORAGE_KEY, JSON.stringify({
    id: `crm:${crmUser._id}`,
    accountId: crmUser._id,
    username: crmUser.email || `crm_${crmUser._id}`,
    name: crmUser.name || 'CRM User',
    email: crmUser.email || '',
    role,
    pageAccess: getWhatsAppPageAccess(crmUser),
  }))
}

export default function WhatsAppMarketingModule() {
  syncCrmUserIntoWhatsAppSession()
  return <WhatsAppMarketingApp />
}
