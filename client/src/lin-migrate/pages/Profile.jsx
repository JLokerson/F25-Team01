import { useEffect, useState } from 'react'
import { getUser } from '../hooks/useAuth'
import { Link, useNavigate } from 'react-router-dom'

export default function Profile() {
  const [driver, setDriver] = useState(null)
  const [err, setErr] = useState('')
  const nav = useNavigate()

  useEffect(() => {
    const user = getUser()
    if (!user) {
      nav('/login')
      return
    }
    // try to find a matching driver by email, otherwise just show the logged-in email
    fetch('/driver.json')
      .then(r => r.ok ? r.json() : Promise.reject(r.statusText))
      .then(list => {
        const match = Array.isArray(list) ? list.find(d => (d.email || '').toLowerCase() === user.email.toLowerCase()) : null
        setDriver(match || { firstName: '—', lastName: '—', phoneNumber: '—', birthday: '—', email: user.email })
      })
      .catch(e => setErr(String(e)))
  }, [nav])

  if (err) return <div className='container error-card'><h3>Error</h3><p className='muted'>{err}</p></div>
  if (!driver) return <div className='container'>Loading...</div>

  const full = [driver.firstName, driver.lastName].filter(Boolean).join(' ') || '—'

  return (
    <div className='profile-card container'>
      <h2>Driver Profile</h2>
      <div className='profile-grid'>
        <div><div className='label'>Name</div><div id='p-name'>{full}</div></div>
        <div><div className='label'>Email</div><div id='p-email'>{driver.email || '—'}</div></div>
        <div><div className='label'>Phone</div><div id='p-phone'>{driver.phoneNumber || '—'}</div></div>
        <div><div className='label'>Birthday</div><div id='p-bday'>{driver.birthday || '—'}</div></div>
      </div>
      <div className='profile-actions'>
        <Link className='btn' to='/products'>Browse Catalog</Link>
        <Link className='btn' to='/cart'>View Cart</Link>
      </div>
    </div>
  )
}
