import { Navigate } from 'react-router-dom'

export default function ProtectedRoute({ children, requiredRole }) {
  const userRole = localStorage.getItem('userRole')
  const userId = localStorage.getItem('userId')

  if (!userRole || !userId) {
    return <Navigate to="/login" replace />
  }

  if (requiredRole && userRole !== requiredRole) {
    return <Navigate to={userRole === 'admin' ? '/admin' : '/employee'} replace />
  }

  return children
}
