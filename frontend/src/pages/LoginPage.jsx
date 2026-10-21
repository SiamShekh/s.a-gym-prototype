import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useDispatch, useSelector } from 'react-redux'
import { Navigate } from 'react-router-dom'
import ThemeToggle from '../components/ThemeToggle'
import { login } from '../store/authSlice'
import { GYM_PHONE } from '../lib/memberUtils'

export default function LoginPage() {
  const dispatch = useDispatch()
  const token = useSelector((s) => s.auth.token)
  const [show, setShow] = useState(false)
  const [error, setError] = useState('')
  const { register, handleSubmit, formState: { isSubmitting } } = useForm({
    defaultValues: { phone: '', password: '' },
  })

  if (token) return <Navigate to="/" replace />

  const onSubmit = async (values) => {
    setError('')
    try {
      await dispatch(login(values)).unwrap()
    } catch (err) {
      const status = err?.status ?? err?.code
      if (status === 0 || err?.message === 'network') {
        setError('সার্ভারে সংযোগ করা যায়নি। ব্যাকএন্ড চালু আছে কি?')
      } else if (status === 401 || status === 400) {
        setError('ভুল ফোন নম্বর বা পাসওয়ার্ড')
      } else {
        setError('লগইন ব্যর্থ হয়েছে')
      }
    }
  }

  return (
    <div className="login-root bg-base-100 text-base-content">
      <div style={{ position: 'absolute', top: 16, right: 16, zIndex: 2 }}>
        <ThemeToggle />
      </div>
      <div className="login-hero">
        <img src="/sa_gym_logo.png" alt="S.A Gym" />
        <h1 className="text-base-content">লগইন করুন</h1>
      </div>
      <form className="login-card bg-base-200 text-base-content" onSubmit={handleSubmit(onSubmit, () => setError('ফোন ও পাসওয়ার্ড দিন'))}>
        <input
          className="login-input"
          placeholder="Phone number"
          inputMode="tel"
          autoComplete="username"
          {...register('phone', { required: true })}
        />
        <div className="pass-row">
          <input
            className="login-input"
            placeholder="Password"
            type={show ? 'text' : 'password'}
            autoComplete="current-password"
            {...register('password', { required: true })}
          />
          <button type="button" className="eye" aria-label="পাসওয়ার্ড দেখুন" onClick={() => setShow((v) => !v)}>
            {show ? '🙈' : '👁'}
          </button>
        </div>
        {error && <div className="err">{error}</div>}
        <button className="login-btn" type="submit" disabled={isSubmitting}>
          লগইন করুন
        </button>
        <p className="legal">S.A Gym ম্যানেজমেন্ট সিস্টেমে প্রবেশ করে আপনি অ্যাডমিন নিয়ম মেনে চলছেন।</p>
        <p className="footer">
          সাহায্য দরকার? মালিকের সাথে যোগাযোগ করুন
          <br />
          <a href={`tel:${GYM_PHONE.replace(/-/g, '')}`}><u>{GYM_PHONE}</u></a>
        </p>
      </form>
    </div>
  )
}
