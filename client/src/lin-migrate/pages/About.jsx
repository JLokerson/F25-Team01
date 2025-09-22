import { useEffect, useState } from 'react'

export default function About() {
  const [data, setData] = useState(null)

  useEffect(() => {
    fetch('/about.json')
      .then(res => res.json())
      .then(setData)
  }, [])

  if (!data) return <p className='p-4'>Loading...</p>

  return (
    <div className='about-content container'>
      <div className='about-card'>
        <h2 className='text-2xl font-bold mb-2'>{data.groupName}</h2>
        <p className='text-gray-400 mb-4'>{data.description}</p>
        <div className='about-grid'>
          {data.members.map(m => (
            <div key={m} className='p-2 bg-gray-800 rounded'>{m}</div>
          ))}
        </div>
      </div>
    </div>
  )
}
