import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { useGetNotificationHistoryQuery } from '../api/saApi'

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
  const [page, setPage] = useState(1)
  const { data, isLoading, isError, isFetching } = useGetNotificationHistoryQuery({
    page,
    limit: 30,
  })

  useEffect(() => {
    if (isError) toast.error('নোটিফিকেশন লোড ব্যর্থ')
  }, [isError])

  const logs = data?.logs || []
  const pagination = data?.pagination || null
  const loading = isLoading || isFetching

  return (
    <div className="stack">
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
