import { useForm } from 'react-hook-form'
import { useDispatch, useSelector } from 'react-redux'
import { toast } from 'sonner'
import { api } from '../api/client'
import { updateSessionProfile } from '../store/authSlice'
import Overlay from './Overlay'

export default function ProfileSheet({ onClose }) {
  const dispatch = useDispatch()
  const token = useSelector((s) => s.auth.token)
  const adminName = useSelector((s) => s.auth.adminName)
  const {
    register,
    handleSubmit,
    formState: { isSubmitting, errors },
  } = useForm({
    defaultValues: {
      name: adminName || '',
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  })

  const onSubmit = async (values) => {
    if (values.newPassword && values.newPassword !== values.confirmPassword) {
      toast.error('নতুন পাসওয়ার্ড মিলছে না')
      return
    }
    if (values.newPassword && !values.currentPassword) {
      toast.error('বর্তমান পাসওয়ার্ড দিন')
      return
    }

    const body = { name: values.name.trim() }
    if (values.newPassword) {
      body.currentPassword = values.currentPassword
      body.newPassword = values.newPassword
    }

    try {
      const data = await api('/auth/profile', { method: 'PATCH', token, body })
      dispatch(updateSessionProfile({ adminName: data.admin?.name }))
      toast.success(values.newPassword ? 'পাসওয়ার্ড আপডেট হয়েছে' : 'প্রোফাইল আপডেট হয়েছে')
      onClose()
    } catch (err) {
      toast.error(err.data?.message || 'আপডেট ব্যর্থ')
    }
  }

  return (
    <Overlay onClose={onClose}>
      <form className="sheet" onClick={(e) => e.stopPropagation()} onSubmit={handleSubmit(onSubmit)}>
        <div className="handle" />
        <h3 style={{ margin: '0 0 4px' }}>প্রোফাইল আপডেট</h3>
        <p className="light" style={{ margin: '0 0 8px', fontSize: 12 }}>
          নাম ও পাসওয়ার্ড পরিবর্তন করুন
        </p>

        <label className="lbl">নাম <i>*</i></label>
        <input className="field" {...register('name', { required: true, minLength: 2 })} />

        <div className="section-label" style={{ marginTop: 16 }}>পাসওয়ার্ড পরিবর্তন (ঐচ্ছিক)</div>

        <label className="lbl">বর্তমান পাসওয়ার্ড</label>
        <input className="field" type="password" autoComplete="current-password" {...register('currentPassword')} />

        <label className="lbl">নতুন পাসওয়ার্ড</label>
        <input
          className="field"
          type="password"
          autoComplete="new-password"
          {...register('newPassword', {
            minLength: { value: 6, message: 'কমপক্ষে ৬ অক্ষর' },
          })}
        />
        {errors.newPassword && <p className="err">{errors.newPassword.message}</p>}

        <label className="lbl">নতুন পাসওয়ার্ড আবার</label>
        <input className="field" type="password" autoComplete="new-password" {...register('confirmPassword')} />

        <button className="btn-red block" type="submit" disabled={isSubmitting} style={{ marginTop: 16 }}>
          সংরক্ষণ
        </button>
      </form>
    </Overlay>
  )
}
