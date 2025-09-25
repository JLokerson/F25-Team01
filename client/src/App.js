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
import CartPage from './components/DriverCart';
import OrderConfirmation from './components/DriverOrderConfirmation';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/about" />} />
        <Route path="/about" element={<About />} />
        <Route path="/login" element={<Login />} />
        <Route path="/recover" element={<Recover />} />
        <Route path="/register" element={<Register />} />
        <Route path="/AdminHome" element={<AdminHome/>} />
        <Route path="/DriverHome" element={<DriverHome/>} />
        <Route path="/SponsorHome" element={<SponsorHome/>} />
        <Route path="/AdminProfile" element={<AdminProfile/>} />
        <Route path="/DriverProfile" element={<DriverProfile/>} />
        <Route path="/SponsorProfile" element={<SponsorProfile/>} />
        <Route path="/Cart" element={<CartPage/>} />
        <Route path="/OrderConfirmation" element={<OrderConfirmation/>}/>
      </Routes>
    </Router>
  );
}

export default App;