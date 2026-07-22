// @ts-nocheck
import { store } from '@/store'
import WhatsAppMarketingApp from '@whatsapp/App'
import '@whatsapp/index.css'

const WHATSAPP_AUTH_STORAGE_KEY = 'whatsapp_auth_user'

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
    pageAccess: crmUser.permissions || [],
  }))
}

export default function WhatsAppMarketingModule() {
  syncCrmUserIntoWhatsAppSession()
  return <WhatsAppMarketingApp />
}
