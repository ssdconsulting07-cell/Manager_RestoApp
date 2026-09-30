import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext.jsx'
import { ROLE_HOME } from '../auth/roles.js'

// Non connecte -> /login. Connecte mais role non autorise -> son propre espace.
export default function ProtectedRoute({ roles, children }) {
  const { role } = useAuth()
  const location = useLocation()

  if (!role) return <Navigate to="/login" replace state={{ from: location.pathname }} />
  if (roles && !roles.includes(role)) return <Navigate to={ROLE_HOME[role]} replace />
  return children
}
