import { useEffect, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { useDispatch, useSelector } from 'react-redux'
import { toast } from 'sonner'
import {
  PLAN_CODES,
  PLAN_LABELS,
  calcExpiry,
  money,
  planAmount,
  planIndex,
  today,
} from '../lib/memberUtils'
import { saveMember } from '../store/membersSlice'
import Overlay from './Overlay'

export default function MemberFormSheet({ memberId, onClose }) {
  const dispatch = useDispatch()
  const existing = useSelector((s) => s.members.list.find((m) => m.id === memberId))
  const editing = Boolean(existing)
  const initialPlan = existing ? PLAN_CODES[planIndex(existing.plan)] : PLAN_CODES[0]

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { isSubmitting, errors },
  } = useForm({
    defaultValues: existing
      ? {
          name: existing.name,
          phone: existing.phone,
          address: existing.address || '',
          join: existing.join,
          plan: initialPlan,
          amount: String(existing.amount ?? planAmount(initialPlan)),
        }
      : {
          name: '',
          phone: '',
          address: '',
          join: today(),
          plan: PLAN_CODES[0],
          amount: String(planAmount(PLAN_CODES[0])),
        },
  })

  const join = watch('join')
  const plan = watch('plan')
  const amount = watch('amount')
  const regular = planAmount(plan)
  const paid = Number(amount)
  const isDiscount = Number.isFinite(paid) && paid > 0 && paid < regular

  const prevPlan = useRef(plan)
  useEffect(() => {
    if (prevPlan.current === plan) return
    prevPlan.current = plan
    setValue('amount', String(planAmount(plan)))
  }, [plan, setValue])

  const onSubmit = async (values) => {
    const customAmount = Number(values.amount)
    if (!Number.isFinite(customAmount) || customAmount <= 0) {
      toast.error('সঠিক পরিমাণ লিখুন')
      return
    }
    const member = {
      id: existing?.id || '',
      name: values.name.trim(),
      phone: values.phone.trim(),
      address: values.address.trim(),
      join: values.join,
      expiry: calcExpiry(values.join, values.plan),
      plan: values.plan,
      amount: customAmount,
      paid: existing?.paid ?? true,
    }
    try {
      const result = await dispatch(saveMember({ member, editing })).unwrap()
      toast.success(
        result.editing
          ? `${result.name}-এর তথ্য আপডেট হয়েছে`
          : `${result.name} নতুন সদস্য হিসেবে যোগ হয়েছে`,
      )
      onClose()
    } catch {
      toast.error('সংরক্ষণ ব্যর্থ')
    }
  }

  return (
    <Overlay onClose={onClose}>
      <form className="sheet" onClick={(e) => e.stopPropagation()} onSubmit={handleSubmit(onSubmit)}>
        <div className="handle" />
        {existing?.code && (
          <p className="light" style={{ fontSize: 12, margin: '0 0 8px' }}>
            Member ID: <strong style={{ color: 'var(--color-base-content)' }}>{existing.code}</strong>
          </p>
        )}
        <label className="lbl">নাম <i>*</i></label>
        <input className="field" placeholder="যেমন: রাহুল ইসলাম" {...register('name', { required: true })} />
        <label className="lbl">ফোন নম্বর <i>*</i></label>
        <input className="field" placeholder="Phone number" inputMode="tel" {...register('phone', { required: true })} />
        <label className="lbl">বর্তমান ঠিকানা <i>*</i></label>
        <input className="field" placeholder="গ্রাম/এলাকা, থানা" {...register('address', { required: true })} />
        <label className="lbl">যোগদানের তারিখ <i>*</i></label>
        <input
          className="field"
          type="date"
          {...register('join', { required: true })}
          onChange={(e) => setValue('join', e.target.value)}
        />
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
          placeholder={`নিয়মিত ${money(regular)}`}
          {...register('amount', {
            required: 'পরিমাণ লিখুন',
            min: { value: 1, message: 'কমপক্ষে ১ টাকা' },
            valueAsNumber: true,
          })}
        />
        {errors.amount && <p className="err">{errors.amount.message}</p>}
        <p className="light" style={{ fontSize: 12 }}>
          মেয়াদ: {join && plan ? calcExpiry(join, plan) : '—'}
          {isDiscount ? ` · ডিসকাউন্ট ${money(paid)} (নিয়মিত ${money(regular)})` : ''}
        </p>
        <button className="btn-red block" type="submit" disabled={isSubmitting} style={{ marginTop: 16 }}>
          {editing ? 'আপডেট করুন' : 'সদস্য তৈরি করুন'}
        </button>
      </form>
    </Overlay>
  )
}
