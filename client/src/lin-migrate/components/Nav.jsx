import { Link } from 'react-router-dom'
import { getUser } from '../hooks/useAuth'
import LogoutButton from './LogoutButton'

export default function Nav() {
  const user = getUser()
  return (
    <nav className='navbar'>
      <div className='nav-inner'>
        <div className='nav-left'>
          <Link to='/migrate/about' className='nav-link'>About Us</Link>
          <Link to='/migrate/products' className='nav-link'>Our Products</Link>
        </div>
        <div className='nav-center'><Link to='/migrate' className='brand'>Network Drivers</Link></div>
        <div className='nav-right'>
          <Link to='/migrate/profile' className='nav-link'>Profile</Link>
          <Link to='/migrate/cart' className='nav-link'>Cart</Link>
          {user && <LogoutButton />}
        </div>
      </div>
    </nav>
  )
}