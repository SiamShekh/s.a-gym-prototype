import { useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { detectPreset, rangeForPreset, rangeLabel } from './dateRange'

const STORAGE_KEY = 'sa-date-range'

function readStored() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const data = JSON.parse(raw)
    if (!data || typeof data !== 'object') return null
    return data
  } catch {
    return null
  }
}

export function useDateRange({ defaultPreset = 'all' } = {}) {
  const [params, setParams] = useSearchParams()
  const hasUrl = params.has('range') || params.has('from') || params.has('to')
  const from = params.get('from') || ''
  const to = params.get('to') || ''
  const dateBy = params.get('dateBy') === 'payment' ? 'payment' : 'join'
  const preset = hasUrl ? params.get('range') || detectPreset(from, to) : defaultPreset

  const write = (nextPreset, nextFrom, nextTo, nextDateBy, { replace = true } = {}) => {
    const next = new URLSearchParams(params)
    next.set('range', nextPreset)
    if (nextFrom) next.set('from', nextFrom)
    else next.delete('from')
    if (nextTo) next.set('to', nextTo)
    else next.delete('to')
    if (nextDateBy === 'payment') next.set('dateBy', 'payment')
    else next.delete('dateBy')
    setParams(next, { replace })
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        preset: nextPreset,
        from: nextFrom || '',
        to: nextTo || '',
        dateBy: nextDateBy === 'payment' ? 'payment' : 'join',
      }),
    )
  }

  useEffect(() => {
    if (hasUrl) {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ preset, from, to, dateBy }),
      )
      return
    }
    const stored = readStored()
    const nextPreset = stored?.preset || defaultPreset
    if (nextPreset === 'custom' && stored?.from && stored?.to) {
      write('custom', stored.from, stored.to, stored.dateBy)
      return
    }
    const range = rangeForPreset(nextPreset)
    write(nextPreset, range.from, range.to, stored?.dateBy || 'join')
    // Intentional: seed the URL once when this page has no range yet.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasUrl, defaultPreset])

  const shown = hasUrl
    ? { preset, from, to }
    : { preset: defaultPreset, ...rangeForPreset(defaultPreset) }

  return {
    ready: hasUrl,
    preset: shown.preset,
    from: shown.from,
    to: shown.to,
    dateBy,
    label: rangeLabel(shown.preset, shown.from, shown.to),
    setPreset(key) {
      const range = rangeForPreset(key)
      write(key, range.from, range.to, dateBy)
    },
    setCustom(nextFrom, nextTo) {
      write('custom', nextFrom, nextTo, dateBy)
    },
    setDateBy(next) {
      write(shown.preset, shown.from, shown.to, next)
    },
  }
}
