// client/src/App.js
import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import About from "./components/About";
import Login from "./components/Login";
import AdminHome from "./components/AdminHome";
import DriverHome from "./components/DriverHome";
import SponsorHome from "./components/SponsorHome";
import Recover from "./components/Recover";
import Register from "./components/Register";
import AdminProfile from "./components/ProfilePages/AdminProfile";
import DriverProfile from "./components/ProfilePages/DriverProfile";
import SponsorProfile from "./components/ProfilePages/SponsorProfile";
import SponsorDriverManagement from "./components/SponsorDriverManagement";
import PendingApplications from "./components/PendingApplications";
import SponsorCatalog from "./components/SponsorCatalog/SponsorCatalog";
import Products from "./components/Products";
import MakeNewUser from "./components/MakeNewUser";
import DriverCart from "./components/DriverCart";
import DriverOrderConfirmation from "./components/DriverOrderConfirmation";
import Home from "./components/Home";
import Testing from "./components/Testing.jsx";
import { CookiesProvider, useCookies } from "react-cookie";

function AppContent() {
  const location = useLocation();
  // Simple auth check: presence of "user" in localStorage
  const userRaw =
    typeof window !== "undefined" ? localStorage.getItem("user") : null;
  let user = null;
  try {
    user = userRaw ? JSON.parse(userRaw) : null;
  } catch (e) {
    user = null;
  }

  return (
    <>
      <Routes>
        {/* General routes */}
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/login" element={<Login />} />
        <Route path="/recover" element={<Recover />} />
        <Route path="/register" element={<Register />} />
        <Route path="/products" element={<Products />} />
        <Route path="/testing" element={<Testing />} />
        {/* <Route path="/OrderConfirmation" element={<OrderConfirmation/>}/> */}
        {/* <Route path="/Cart" element={<CartPage/>}/> */}
        <Route path="/MakeNewUser" element={<MakeNewUser />} />

        {/* Admin routes */}
        <Route path="/adminhome" element={<AdminHome />} />
        <Route path="/adminprofile" element={<AdminProfile />} />
        <Route path="/admin-applications" element={<AdminApplications />} />
        <Route path="/admin-user-management" element={<AdminUserManagement />} />
        <Route path="/adminauditview" element={<AdminAuditView />} />

        {/* Sponsor routes */}
        <Route path="/sponsorhome" element={<SponsorHome />} />
        <Route path="/sponsorprofile" element={<SponsorProfile />} />
        <Route
          path="/sponsor-driver-management"
          element={<SponsorDriverManagement />}
        />
        <Route path="/pending-applications" element={<PendingApplications />} />
        <Route path="/sponsorcatalog" element={<SponsorCatalog />} />

        {/* Driver routes */}
        <Route path="/driverhome" element={<DriverHome />} />
        <Route path="/driverprofile" element={<DriverProfile />} />
        <Route path="/drivercart" element={<DriverCart />} />
        <Route
          path="/driverorderconfirmation"
          element={<DriverOrderConfirmation />}
        />

        {/* Shared pages */}

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

function App() {
  return (
    <CookiesProvider>
      <Router>
        <AppContent />
      </Router>
    </CookiesProvider>
  );
}

export default App;
