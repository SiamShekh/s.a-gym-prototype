import { useSelector } from 'react-redux'
import { Navigate } from 'react-router-dom'
import { hasPermission } from '../lib/permissions'

export default function RequirePermission({ permission, children }) {
  const role = useSelector((s) => s.auth.adminRole)
  const permissions = useSelector((s) => s.auth.permissions)

  if (!hasPermission(role, permissions, permission)) {
    return <Navigate to="/more" replace />
  }
  return children
}
