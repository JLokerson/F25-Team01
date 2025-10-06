import React from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import { useNavigate } from 'react-router-dom';

export default function PasswordChangeModal({ show, onClose }) {
  const navigate = useNavigate();

  const handleChangePassword = () => {
    onClose();
    
    // Get user info to determine correct profile page
    const userString = localStorage.getItem('user');
    if (userString) {
      const user = JSON.parse(userString);
      const userType = user.UserType;
      
      // Navigate to appropriate profile page based on user type
      if (userType === 1) {
        navigate('/driverprofile'); // Driver profile
      } else if (userType === 2) {
        navigate('/sponsorprofile'); // Sponsor profile
      } else if (userType === 3) {
        navigate('/adminprofile'); // Admin profile
      } else {
        navigate('/profile'); // Default fallback
      }
    } else {
      navigate('/profile'); // Fallback if no user data
    }
  };

  const handleRemindLater = () => {
    // Set a flag to remind again in a week
    const remindDate = new Date();
    remindDate.setDate(remindDate.getDate() + 7);
    localStorage.setItem('passwordChangeReminder', remindDate.toISOString());
    onClose();
  };

  if (!show) return null;

  return (
    <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Password Security Reminder</h5>
          </div>
          <div className="modal-body">
            <p>
              It's been more than 3 months since your last login. For your security, 
              we recommend updating your password regularly.
            </p>
            <p>
              Would you like to change your password now?
            </p>
          </div>
          <div className="modal-footer">
            <button 
              type="button" 
              className="btn btn-secondary" 
              onClick={handleRemindLater}
            >
              Remind Me Later
            </button>
            <button 
              type="button" 
              className="btn btn-primary" 
              onClick={handleChangePassword}
            >
              Change Password
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
