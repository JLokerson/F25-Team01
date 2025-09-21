// client/src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import About from './components/About';
import Login from './components/Login';
import AdminHome from './components/AdminHome';
import DriverHome from './components/DriverHome';
import SponsorHome from './components/SponsorHome';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/about" />} />
        <Route path="/about" element={<About />} />
        <Route path="/login" element={<Login />} />
        <Route path="/AdminHome" element={<AdminHome/>} />
        <Route path="/DriverHome" element={<DriverHome/>} />
        <Route path="/SponsorHome" element={<SponsorHome/>} />
      </Routes>
    </Router>
  );
}

export default App;