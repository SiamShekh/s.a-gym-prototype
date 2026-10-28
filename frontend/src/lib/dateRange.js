import { addDays, today } from './memberUtils'

export const RANGE_PRESETS = [
  ['today', 'আজ'],
  ['7d', 'গত ৭ দিন'],
  ['30d', 'গত ৩০ দিন'],
  ['month', 'এই মাস'],
  ['lastMonth', 'গত মাস'],
  ['year', 'গত ১ বছর'],
  ['all', 'সব'],
]

function monthBounds(year, monthIndex) {
  const last = new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate()
  const mm = String(monthIndex + 1).padStart(2, '0')
  return {
    from: `${year}-${mm}-01`,
    to: `${year}-${mm}-${String(last).padStart(2, '0')}`,
  }
}

/** Inclusive calendar range in Asia/Dhaka, matching the gym's stored dates. */
export function rangeForPreset(key, now = today()) {
  if (key === 'today') return { from: now, to: now }
  if (key === '7d') return { from: addDays(now, -6), to: now }
  if (key === '30d') return { from: addDays(now, -29), to: now }
  if (key === 'month') {
    const [y, m] = now.split('-').map(Number)
    return monthBounds(y, m - 1)
  }
  if (key === 'lastMonth') {
    const [y, m] = now.split('-').map(Number)
    const prev = new Date(Date.UTC(y, m - 2, 1))
    return monthBounds(prev.getUTCFullYear(), prev.getUTCMonth())
  }
  if (key === 'year') return { from: addDays(now, -364), to: now }
  return { from: '', to: '' }
}

export function detectPreset(from, to, now = today()) {
  if (!from && !to) return 'all'
  for (const [key] of RANGE_PRESETS) {
    if (key === 'all') continue
    const range = rangeForPreset(key, now)
    if (range.from === from && range.to === to) return key
  }
  return 'custom'
}

export function formatIsoBn(iso) {
  if (!iso) return ''
  const date = new Date(`${iso}T12:00:00+06:00`)
  if (Number.isNaN(date.getTime())) return iso
  return date.toLocaleDateString('bn-BD', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'Asia/Dhaka',
  })
}

export function rangeLabel(preset, from, to) {
  const name = RANGE_PRESETS.find(([key]) => key === preset)?.[1] || 'কাস্টম'
  if (preset === 'all' || (!from && !to)) return 'সব সময়'
  const dates = `${formatIsoBn(from)} – ${formatIsoBn(to)}`
  if (preset === 'custom') return `কাস্টম · ${dates}`
  return `${name} · ${dates}`
}

export function apiRange(range) {
  if (!range?.ready || range.preset === 'all' || (!range.from && !range.to)) {
    return { from: undefined, to: undefined }
  }
  return { from: range.from, to: range.to }
}
