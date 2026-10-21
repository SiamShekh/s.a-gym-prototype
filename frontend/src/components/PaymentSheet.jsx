import { useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useDispatch, useSelector } from 'react-redux'
import { toast } from 'sonner'
import {
  PLAN_CODES,
  PLAN_LABELS,
  formatDate,
  money,
  planAmount,
  planIndex,
} from '../lib/memberUtils'
import { processPayment } from '../store/membersSlice'
import Overlay from './Overlay'

const METHODS = [
  ['bkash', 'bKash\nমোবাইল ব্যাংকিং'],
  ['nagad', 'Nagad\nমোবাইল ব্যাংকিং'],
  ['rocket', 'Rocket\nDBBL'],
  ['cash', 'নগদ টাকা\nCash'],
]

const LABELS = { bkash: 'bKash নম্বর', nagad: 'Nagad নম্বর', rocket: 'Rocket নম্বর' }

export default function PaymentSheet({ memberId, onClose }) {
  const dispatch = useDispatch()
  const member = useSelector((s) => s.members.list.find((m) => m.id === memberId))
  const [method, setMethod] = useState(null)
  const defaultPlan = member ? PLAN_CODES[planIndex(member.plan)] : PLAN_CODES[0]
  const defaultAmount = member?.amount > 0 ? member.amount : planAmount(defaultPlan)
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { isSubmitting, errors },
  } = useForm({
    defaultValues: {
      plan: defaultPlan,
      amount: String(defaultAmount),
      number: '',
      txn: '',
    },
  })

  const plan = watch('plan')
  const amount = watch('amount')
  const regular = planAmount(plan)
  const paid = Number(amount)
  const needsNumber = method && method !== 'cash'
  const isDiscount = Number.isFinite(paid) && paid > 0 && paid < regular

  const prevPlan = useRef(plan)
  useEffect(() => {
    if (prevPlan.current === plan) return
    prevPlan.current = plan
    setValue('amount', String(planAmount(plan)))
  }, [plan, setValue])

  if (!member) return null

  const onSubmit = async (values) => {
    if (!method) {
      toast.error('পেমেন্ট পদ্ধতি বাছুন')
      return
    }
    const customAmount = Number(values.amount)
    if (!Number.isFinite(customAmount) || customAmount <= 0) {
      toast.error('সঠিক পরিমাণ লিখুন')
      return
    }
    try {
      const result = await dispatch(
        processPayment({
          memberId: member.id,
          plan: values.plan,
          method,
          amount: customAmount,
        }),
      ).unwrap()
      toast.success(
        `${result.name}-এর পেমেন্ট সম্পন্ন (${money(customAmount)}, ${method})! মেয়াদ ${formatDate(result.expiry)} পর্যন্ত`,
      )
      onClose()
    } catch {
      toast.error('পেমেন্ট ব্যর্থ')
    }
  }

  return (
    <Overlay onClose={onClose}>
      <form
        className="sheet"
        onClick={(e) => e.stopPropagation()}
        onSubmit={handleSubmit(onSubmit)}
      >
        <div className="handle" />
       
        <label className="lbl">প্যাকেজ <i>*</i></label>
        <select className="select" {...register('plan', { required: true })}>
          {PLAN_CODES.map((code, i) => (
            <option key={code} value={code}>{PLAN_LABELS[i]}</option>
          ))}
        </select>

        <label className="lbl">পরিশোধিত টাকা <i>*</i></label>
        <input
          className="field"
          type="number"
          inputMode="numeric"
          min="1"
          step="1"
          placeholder={`নিয়মিত ${money(regular)} — ডিসকাউন্ট হলে কম লিখুন`}
          {...register('amount', {
            required: 'পরিমাণ লিখুন',
            min: { value: 1, message: 'কমপক্ষে ১ টাকা' },
            valueAsNumber: true,
          })}
        />
        {errors.amount && <p className="err">{errors.amount.message}</p>}

        <div className="amount-box" style={{ marginTop: 12 }}>
          <div className="light" style={{ fontSize: 12 }}>
            {member.name}-এর জন্য
            {isDiscount ? ` · ডিসকাউন্ট (নিয়মিত ${money(regular)})` : ''}
          </div>
          <div className="amount">{money(Number.isFinite(paid) && paid > 0 ? paid : regular)}</div>
        </div>

        <div className="section-label" style={{ letterSpacing: '0.04em', marginTop: 16 }}>
          পেমেন্ট পদ্ধতি বেছে নিন
        </div>
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
            <label className="lbl">{LABELS[method]}</label>
            <input className="field" placeholder="01XXXXXXXXX" inputMode="tel" {...register('number')} />
            <label className="lbl">ট্রানজেকশন ID</label>
            <input className="field" placeholder="TXN ID (ঐচ্ছিক)" {...register('txn')} />
          </>
        )}

        <button className="btn-red block" type="submit" disabled={isSubmitting} style={{ marginTop: 16 }}>
          পেমেন্ট নিশ্চিত করুন
        </button>
      </form>
    </Overlay>
  )
}
