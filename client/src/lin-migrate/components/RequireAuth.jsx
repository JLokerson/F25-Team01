import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { getUser } from '../hooks/useAuth'

export default function RequireAuth({ children }) {
  const location = useLocation()
  const user = getUser()
  if (!user) {
    return <Navigate to="/migrate/login" state={{ from: location }} replace />
  }
  return children
}


