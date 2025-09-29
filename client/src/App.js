// client/src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import About from './components/About';
import Login from './components/Login';
import AdminHome from './components/AdminHome';
import DriverHome from './components/DriverHome';
import SponsorHome from './components/SponsorHome';
import Recover from './components/Recover';
import Register from './components/Register';
import AdminProfile from './components/ProfilePages/AdminProfile'
import DriverProfile from './components/ProfilePages/DriverProfile'
import SponsorProfile from './components/ProfilePages/SponsorProfile';
import Products from './components/Products';
import CartPage from './components/CartPage';
import DriverCart from './components/DriverCart';
import DriverOrderConfirmation from './components/DriverOrderConfirmation';
import Navbar from './components/Navbar';
import Home from './components/Home';

function App() {
  // Simple auth check: presence of "user" in localStorage
  const userRaw = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
  let user = null;
  try {
    user = userRaw ? JSON.parse(userRaw) : null;
  } catch (e) {
    user = null;
  }

  return (
    <Router>
      {/* Show Navbar only when logged in */}
      {user && <Navbar user={user} />}

      <Routes>
        {/* General routes */}
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/login" element={<Login />} />
        <Route path="/recover" element={<Recover />} />
        <Route path="/register" element={<Register />} />
        <Route path="/products" element={<Products />} />
        <Route path="/cart" element={<CartPage />} />

        {/* Admin routes */}
        <Route path="/adminhome" element={<AdminHome />} />
        <Route path="/adminprofile" element={<AdminProfile />} />

        {/* Sponsor routes */}
        <Route path="/sponsorhome" element={<SponsorHome />} />
        <Route path="/sponsorprofile" element={<SponsorProfile />} />

        {/* Driver routes */}
        <Route path="/driverhome" element={<DriverHome />} />
        <Route path="/driverprofile" element={<DriverProfile />} />
        <Route path="/drivercart" element={<DriverCart />} />
        <Route path="/driverorderconfirmation" element={<DriverOrderConfirmation />} />

        {/* Shared pages */}

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;