import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useSelector } from 'react-redux'
import { Navigate } from 'react-router-dom'
import ThemeToggle from '../components/ThemeToggle'
import { useLoginMutation } from '../api/saApi'
import { GYM_PHONE } from '../lib/memberUtils'

export default function LoginPage() {
  const token = useSelector((s) => s.auth.token)
  const [login, { isLoading }] = useLoginMutation()
  const [show, setShow] = useState(false)
  const [error, setError] = useState('')
  const { register, handleSubmit } = useForm({
    defaultValues: { phone: '', password: '' },
  })

  if (token) return <Navigate to="/" replace />

  const onSubmit = async (values) => {
    setError('')
    try {
      await login(values).unwrap()
    } catch (err) {
      const status = err?.status
      if (status === 'FETCH_ERROR' || status === 0) {
        setError('সার্ভারে সংযোগ করা যায়নি। ব্যাকএন্ড চালু আছে কি?')
      } else if (status === 405 || status === 502) {
        setError('API কানেক্ট হয়নি। Railway frontend-এ VITE_API_URL সেট করে রিডিপ্লয় করুন।')
      } else if (status === 401 || status === 400) {
        setError('ভুল ফোন নম্বর বা পাসওয়ার্ড')
      } else {
        setError(err?.data?.message || 'লগইন ব্যর্থ হয়েছে')
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
        <button className="login-btn" type="submit" disabled={isLoading}>
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
