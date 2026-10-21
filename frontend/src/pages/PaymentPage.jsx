import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useDispatch, useSelector } from 'react-redux'
import { toast } from 'sonner'
import { PLAN_CODES, PLAN_LABELS, formatDate, money, planAmount } from '../lib/memberUtils'
import { consumePayRequest, processPayment } from '../store/membersSlice'

const METHODS = [
  ['bkash', 'bKash\nমোবাইল ব্যাংকিং'],
  ['nagad', 'Nagad\nমোবাইল ব্যাংকিং'],
  ['rocket', 'Rocket\nDBBL'],
  ['upay', 'Upay\nUCB'],
  ['cash', 'নগদ টাকা\nCash'],
  ['bank', 'ব্যাংক\nTransfer'],
]

const LABELS = { bkash: 'bKash নম্বর', nagad: 'Nagad নম্বর', rocket: 'Rocket নম্বর', upay: 'Upay নম্বর' }

export default function PaymentPage() {
  const members = useSelector((s) => s.members.list)
  const pendingId = useSelector((s) => s.members.pendingPayMemberId)
  const dispatch = useDispatch()
  const [method, setMethod] = useState(null)
  const { register, handleSubmit, watch, reset, setValue } = useForm({
    defaultValues: { memberId: '', plan: PLAN_CODES[0], number: '', txn: '' },
  })

  useEffect(() => {
    if (pendingId) {
      setValue('memberId', pendingId)
      dispatch(consumePayRequest())
    }
  }, [pendingId, setValue, dispatch])

  const memberId = watch('memberId')
  const plan = watch('plan')
  const member = members.find((m) => m.id === memberId)
  const needsNumber = method && method !== 'cash' && method !== 'bank'

  const onSubmit = async () => {
    if (!memberId) {
      toast.error('সদস্য বাছুন')
      return
    }
    if (!method) {
      toast.error('পেমেন্ট পদ্ধতি বাছুন')
      return
    }
    try {
      const result = await dispatch(processPayment({ memberId, plan, method })).unwrap()
      toast.success(`${result.name}-এর পেমেন্ট সম্পন্ন (${method})! মেয়াদ ${formatDate(result.expiry)} পর্যন্ত`)
      setMethod(null)
      reset({ memberId: '', plan: PLAN_CODES[0], number: '', txn: '' })
    } catch {
      toast.error('পেমেন্ট ব্যর্থ')
    }
  }

  return (
    <form className="card stack pay-form" onSubmit={handleSubmit(onSubmit)}>
      <h2 className="section-title" style={{ fontSize: 16 }}>পেমেন্ট গ্রহণ করুন</h2>
      <div>
        <div className="light" style={{ fontSize: 12, marginBottom: 6 }}>সদস্য নির্বাচন করুন</div>
        <select className="select" {...register('memberId')}>
          <option value="">— সদস্য বাছুন —</option>
          {members.map((m) => (
            <option key={m.id} value={m.id}>{m.name} ({m.phone})</option>
          ))}
        </select>
      </div>
      <div>
        <div className="light" style={{ fontSize: 12, marginBottom: 6 }}>প্যাকেজ</div>
        <select className="select" {...register('plan')}>
          {PLAN_CODES.map((code, i) => (
            <option key={code} value={code}>{PLAN_LABELS[i]}</option>
          ))}
        </select>
      </div>
      <div className="amount-box">
        <div className="light" style={{ fontSize: 12 }}>{member ? `${member.name}-এর জন্য` : 'সদস্য নির্বাচন করুন'}</div>
        <div className="amount">{money(planAmount(plan))}</div>
      </div>
      <div className="section-label" style={{ letterSpacing: '0.04em' }}>পেমেন্ট পদ্ধতি বেছে নিন</div>
      <div className="pay-grid">
        {METHODS.map(([key, label]) => (
          <button
            key={key}
            type="button"
            className={`pay-method${method === key ? ' selected' : ''}`}
            onClick={() => setMethod(key)}
          >
            {label}
          </button>
        ))}
      </div>
      {needsNumber && (
        <>
          <div>
            <div className="light" style={{ fontSize: 12, marginBottom: 6 }}>{LABELS[method]}</div>
            <input className="field" placeholder="01XXXXXXXXX" inputMode="tel" {...register('number')} />
          </div>
          <div>
            <div className="light" style={{ fontSize: 12, marginBottom: 6 }}>ট্রানজেকশন ID</div>
            <input className="field" placeholder="TXN ID (ঐচ্ছিক)" {...register('txn')} />
          </div>
        </>
      )}
      <button className="btn-red block" type="submit">পেমেন্ট নিশ্চিত করুন</button>
    </form>
  )
}
