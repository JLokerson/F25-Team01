import { logout } from '../hooks/useAuth'
import { useNavigate } from 'react-router-dom'

export default function LogoutButton({ className = 'btn small' }) {
  const nav = useNavigate()
  return (
    <button
      className={className}
      onClick={() => { logout(); nav('/migrate/login') }}
    >
      Log out
    </button>
  )
}
