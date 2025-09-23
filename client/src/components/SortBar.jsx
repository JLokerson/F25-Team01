import { useSearchParams } from 'react-router-dom'

const OPTIONS_BY_ROLE = {
  driver: [
    { value: 'popular', label: 'Most Popular' },
  ],
  sponsor: [
    { value: 'rating_asc', label: 'Rating: Low → High' },
    { value: 'rating_desc', label: 'Rating: High → Low' },
    { value: 'popular', label: 'Most Popular' },
    { value: 'sales_desc', label: 'Top Sales' },
  ],
}

export default function SortBar({ role = 'driver' }) {
  const [sp, setSp] = useSearchParams()
  const sort = sp.get('sort') || (role === 'sponsor' ? 'rating_desc' : 'popular')
  const opts = OPTIONS_BY_ROLE[role] || OPTIONS_BY_ROLE.driver

  function onChange(e) {
    sp.set('sort', e.target.value)
    setSp(sp, { replace: true })
  }

  return (
    <div className='sortbar'>
      <label>sort: </label>
      <select value={sort} onChange={onChange}>
        {opts.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  )
}


