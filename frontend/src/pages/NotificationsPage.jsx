import { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { toast } from 'sonner'
import { api } from '../api/client'

const STATUS_LABEL = {
  sent: 'পাঠানো',
  dry_run: 'ড্রাই-রান',
  skipped_duplicate: 'ডুপ্লিকেট স্কিপ',
  skipped_cap: 'লিমিট স্কিপ',
  skipped_opt_out: 'অপ্ট-আউট',
  skipped_invalid_phone: 'অবৈধ ফোন',
  skipped_budget: 'বাজেট স্কিপ',
  failed: 'ব্যর্থ',
}

function formatWhen(iso) {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleString('bn-BD', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function NotificationsPage() {
  const token = useSelector((s) => s.auth.token)
  const [queue, setQueue] = useState(null)
  const [logs, setLogs] = useState([])
  const [pagination, setPagination] = useState(null)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)

  const load = async (p = page) => {
    setLoading(true)
    try {
      const [q, h] = await Promise.all([
        api('/notifications/queue', { token }),
        api(`/notifications/history?page=${p}&limit=30`, { token }),
      ])
      setQueue(q.queue || q.preview || null)
      setLogs(h.logs || [])
      setPagination(h.pagination || null)
    } catch {
      toast.error('নোটিফিকেশন লোড ব্যর্থ')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load(page)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, page])

  const sections = queue?.sections || []
  const todaySent = logs.filter((l) => {
    if (!l.createdAt) return false
    const day = new Date(l.createdAt).toDateString()
    return day === new Date().toDateString() && (l.status === 'sent' || l.status === 'dry_run')
  }).length

  return (
    <div className="stack">
      <section className="banner">
        <strong>SMS অটো-নোটিফিকেশন</strong>
        <p className="light" style={{ margin: '4px 0 0', fontSize: 12 }}>
          প্রতিদিন স্বয়ংক্রিয়ভাবে পাঠানো হয় (Asia/Dhaka)। শুক্রবার বন্ধ।
          ম্যানুয়াল অ্যালার্ট বাটন নেই — নিচে হিস্টোরি দেখুন।
        </p>
        <div className="notify-status-row">
          <span className="notify-pill">
            {queue?.smsEnabled ? 'SMS চালু' : 'ড্রাই-রান মোড'}
          </span>
          <span className="notify-pill">
            লিমিট {queue?.maxChars || 70} অক্ষর
          </span>
          {queue?.skipToday ? (
            <span className="notify-pill danger">আজ স্কিপ (শুক্রবার)</span>
          ) : (
            <span className="notify-pill">আজ ক্রন চলবে</span>
          )}
        </div>
      </section>

      <section className="card bg-base-100">
        <h2 className="section-title">আজকের কিউ (অটো)</h2>
        <p className="light" style={{ fontSize: 12, margin: '0 0 12px' }}>
          ক্রন এই গ্রুপগুলো থেকে পাঠাবে — প্রতি স্টেজে একবার, মেয়াদ শেষের ৭ দিন পর আর পাঠাবে না।
        </p>
        {loading && !queue && <p className="empty">লোড হচ্ছে…</p>}
        <div className="notify-queue-grid">
          {sections.map((s) => (
            <article className="notify-queue-card" key={s.key}>
              <strong>{s.count}</strong>
              <span>{s.title}</span>
              <em>{s.hint}</em>
            </article>
          ))}
        </div>
        <div className="meta" style={{ marginTop: 12 }}>
          কিউতে মোট {queue?.total ?? 0} জন · আজকের লগে পাঠানো/ড্রাই-রান ≈ {todaySent}
        </div>
      </section>

      <section>
        <div className="section-label">মেসেজ হিস্টোরি</div>
        {loading && !logs.length && <p className="empty">লোড হচ্ছে…</p>}
        {!loading && !logs.length && <p className="empty">এখনো কোনো SMS লগ নেই</p>}
        <div className="card-grid">
          {logs.map((log) => (
            <article className="card member bg-base-100" key={log.id}>
              <div className="row">
                <div className="grow">
                  <div className="name">{log.memberName || 'সদস্য'}</div>
                  <div className="phone">
                    {log.memberCode ? `${log.memberCode} · ` : ''}
                    {log.phone}
                    {' · '}
                    {log.bucketTitle || log.bucket}
                  </div>
                </div>
                <span
                  className={`badge ${log.status === 'sent' || log.status === 'dry_run' ? 'ok' : 'hot'}`}
                >
                  {STATUS_LABEL[log.status] || log.status}
                </span>
              </div>
              <div className="meta">
                {log.message}
                {'\n'}
                {formatWhen(log.createdAt)}
                {' · '}
                {log.source === 'cron' ? 'Cron' : log.adminName || 'Admin'}
                {' · '}
                {log.charCount} অক্ষর
                {log.error ? `\n${log.error}` : ''}
              </div>
            </article>
          ))}
        </div>

        {pagination && pagination.totalPages > 1 && (
          <div className="pagination">
            <button
              className="btn-ghost"
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              আগে
            </button>
            <div className="pagination-status">
              {pagination.page} / {pagination.totalPages}
            </div>
            <button
              className="btn-ghost"
              type="button"
              disabled={page >= pagination.totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              পরে
            </button>
          </div>
        )}
      </section>
    </div>
  )
}
