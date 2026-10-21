export const GYM_PHONE = '01746-933966'
export const PLAN_CODES = ['30:1000', '90:2500', '365:10000']
export const PLAN_LABELS = ['১ মাস — ৳১,০০০', '৩ মাস — ৳২,৫০০', '১২ মাস — ৳১০,০০০']

function iso(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function today() {
  return iso(new Date())
}

export function formatDate(date) {
  if (!date) return '—'
  const parts = String(date).split('-')
  if (parts.length !== 3) return date
  return `${parts[0]}/${parts[1]}/${parts[2]}`
}

export function daysLeft(expiry) {
  const end = new Date(`${expiry}T00:00:00`)
  const start = new Date(`${today()}T00:00:00`)
  if (Number.isNaN(end.getTime())) return 0
  return Math.round((end.getTime() - start.getTime()) / 86400000)
}

export function statusOf(member) {
  const d = daysLeft(member.expiry)
  if (d < 0) return { label: 'মেয়াদ শেষ', key: 'expired', urgent: true }
  if (d <= 3) return { label: `জরুরি! ${d} দিন`, key: 'expiring', urgent: true }
  if (d <= 7) return { label: `${d} দিন বাকি`, key: 'expiring', urgent: false }
  return { label: 'সক্রিয়', key: 'active', urgent: false }
}

export function planLabel(plan) {
  if (plan === '30:1000' || plan === '30:500') return '১ মাস'
  if (plan === '90:2500' || plan === '90:1200') return '৩ মাস'
  if (plan === '365:10000' || plan === '365:4000') return '১২ মাস'
  if (plan === '60:900') return '২ মাস'
  return plan
}

export function planIndex(plan) {
  const normalized =
    plan === '30:500' ? '30:1000' : plan === '90:1200' ? '90:2500' : plan === '365:4000' ? '365:10000' : plan
  const idx = PLAN_CODES.indexOf(normalized)
  return idx >= 0 ? idx : 0
}

export function planAmount(plan) {
  return Number(String(plan).split(':')[1]) || 0
}

export function planDays(plan) {
  return Number(String(plan).split(':')[0]) || 30
}

export function calcExpiry(join, plan) {
  const date = new Date(`${join}T00:00:00`)
  if (Number.isNaN(date.getTime())) return join
  date.setDate(date.getDate() + planDays(plan))
  return iso(date)
}

export function money(amount) {
  return `৳${Number(amount || 0).toLocaleString('en-US')}`
}

export function whatsappUrl(phone, message) {
  const normalized = phone.startsWith('0') ? phone.slice(1) : phone
  return `https://wa.me/88${normalized}?text=${encodeURIComponent(message)}`
}

export function filterMembers(members, query, filter) {
  const q = query.trim().toLowerCase()
  return members.filter((m) => {
    const match = !q || m.name.toLowerCase().includes(q) || m.phone.includes(q)
    if (!match) return false
    const key = statusOf(m).key
    if (filter === 'active') return key === 'active'
    if (filter === 'expiring') return key === 'expiring'
    if (filter === 'expired') return key === 'expired'
    return true
  })
}
