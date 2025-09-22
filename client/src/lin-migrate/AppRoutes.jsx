import React from 'react'
import { Routes, Route } from 'react-router-dom'
import Nav from './components/Nav'
import Footer from './components/Footer'
import Home from './pages/Home'
import Products from './pages/Products'
import Cart from './pages/Cart'
import Login from './pages/Login'
import Profile from './pages/Profile'
import About from './pages/About'

export default function AppRoutes() {
  return (
    <div className='min-h-screen flex flex-col bg-[var(--bg)] text-[var(--text)]'>
      <Nav />
      <main className='flex-1'>
        <Routes>
          <Route path='/' element={<Home />} />
          <Route path='/products' element={<Products />} />
          <Route path='/cart' element={<Cart />} />
          <Route path='/login' element={<Login />} />
          <Route path='/profile' element={<Profile />} />
          <Route path='/about' element={<About />} />
          <Route path='*' element={<div className='p-10 text-center'>404 Not Found</div>} />
        </Routes>
      </main>
      <Footer />
    </div>
  )
}
