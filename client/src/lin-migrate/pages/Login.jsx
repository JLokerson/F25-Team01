import { useState } from 'react'
import { demoLogin } from '../hooks/useAuth'
import { useNavigate } from 'react-router-dom'

export default function Login() {
  const [email, setEmail] = useState('')
  const [pass, setPass] = useState('')
  const [msg, setMsg] = useState('')
  const nav = useNavigate()

  async function onSubmit(e) {
    e.preventDefault()
    const res = await demoLogin(email, pass)
    if (res.ok) {
      setMsg('Logged in. Redirecting...')
      nav('/products')
    } else {
      setMsg(res.msg || 'Login failed')
    }
  }

  return (
    <div className='login-card'>
      <h2>Welcome back</h2>
      <p className='muted'>Demo auth: use your full Gmail as username and your last name as the password.</p>

      <form className='grid gap-2' onSubmit={onSubmit}>
        <label>Email (Gmail)</label>
        <input value={email} onChange={e => setEmail(e.target.value)} type='email' placeholder='you@gmail.com' required />
        <label>Password (Last Name)</label>
        <input value={pass} onChange={e => setPass(e.target.value)} type='password' placeholder='YourLastName' required />
        <button className='btn btn--primary' type='submit'>Log In</button>
      </form>
      {msg && <div className='msg mt-2'>{msg}</div>}
    </div>
  )
}
