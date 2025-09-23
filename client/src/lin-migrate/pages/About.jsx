import { useEffect, useState } from 'react'

export default function About() {
  const [data, setData] = useState(null)
  const [err, setErr] = useState('')

  useEffect(() => {
    fetch('/about.json')
      .then(r => r.ok ? r.json() : Promise.reject(r.statusText))
      .then(setData)
      .catch(e => setErr(String(e)))
  }, [])

  if (err) return <div className='container error-card'><h3>Error</h3><p className='muted'>{err}</p></div>
  if (!data) return <div className='container'>Loading...</div>

  return (
    <div className='about-content container'>
      <div className='about-card'>
        <h2 className='text-2xl font-bold mb-2'>{data.groupName} — {data.productName}</h2>
        <p className='muted mb-3'>v{data.version} • {data.releaseDate}</p>
        <p className='mb-4'>{data.description}</p>

        <div className='team-section'>
          <h3 className='font-semibold'>Team</h3>
          <ul className='team-list mt-2'>
            {data.members.map(m => <li key={m}>{m}</li>)}
          </ul>
        </div>
      </div>
    </div>
  )
}
