import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function SponsorImpostorModeModal({ show, onClose, onSetImpostorMode }) {
    const navigate = useNavigate();

    const handleDriverMode = () => {
        onSetImpostorMode('driver');
        navigate('/DriverHome', { replace: true });
    };

    if (!show) {
        return null;
    }

    return (
        <div className="modal d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="modal-dialog">
                <div className="modal-content">
                    <div className="modal-header">
                        <h5 className="modal-title">Enter Driver Impostor Mode</h5>
                        <button type="button" className="btn-close" onClick={onClose}></button>
                    </div>
                    <div className="modal-body">
                        <p>As a sponsor, you can impersonate a driver to better understand their experience:</p>
                        
                        <div className="card">
                            <div className="card-body text-center">
                                <h5 className="card-title">Driver Mode</h5>
                                <p className="card-text">Experience the application as a driver would see it.</p>
                                <button className="btn btn-primary" onClick={handleDriverMode}>
                                    Enter Driver Mode
                                </button>
                            </div>
                        </div>
                    </div>
                    <div className="modal-footer">
                        <button type="button" className="btn btn-secondary" onClick={onClose}>
                            Cancel
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
