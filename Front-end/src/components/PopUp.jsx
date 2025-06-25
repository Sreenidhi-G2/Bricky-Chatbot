import React, { useState, useEffect } from 'react';
import { FiX, FiClock, FiServer } from 'react-icons/fi';
import '../styles/popup.css';

const Popup = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check if user has seen the popup before
    const hasSeenPopup = localStorage.getItem('bricky-backend-notice');
    
    if (!hasSeenPopup) {
      // Show popup after a short delay
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    // Remember that user has seen the popup
    localStorage.setItem('bricky-backend-notice', 'true');
  };

  const handleGotIt = () => {
    handleClose();
  };

  if (!isVisible) return null;

  return (
    <div className="popup-overlay">
      <div className="popup-container">
        {/* Header */}
        <div className="popup-header">
          <div className="popup-header-content">
            <div className="popup-icon-container">
              <FiServer className="popup-server-icon" />
            </div>
            <h3 className="popup-title">
              Backend Notice
            </h3>
          </div>
          <button
            onClick={handleClose}
            className="popup-close-btn"
          >
            <FiX className="popup-close-icon" />
          </button>
        </div>

        {/* Content */}
        <div className="popup-content">
          <div className="popup-main-content">
            <div className="popup-clock-container">
              <FiClock className="popup-clock-icon" />
            </div>
            <div className="popup-text-content">
              <h4>First Request May Take Longer</h4>
              <p className="popup-description">
                Our backend is hosted on Render's free tier, which puts the server to sleep after periods of inactivity. 
                The first request might take <span className="popup-highlight">30-60 seconds</span> to wake up the server.
              </p>
            </div>
          </div>

          <div className="popup-info-box">
            <div className="popup-info-header">
              <div className="popup-bullet"></div>
              <span className="popup-info-title">What to expect:</span>
            </div>
            <ul className="popup-info-list">
              <li>• First message: 30-60 seconds</li>
              <li>• Subsequent messages: Normal speed</li>
              <li>• Server stays active for 15 minutes</li>
            </ul>
          </div>

          <p className="popup-footer-text">
            Thank you for your patience as we provide this service free of charge!
          </p>

          {/* Action Button */}
          <button
            onClick={handleGotIt}
            className="popup-action-btn"
          >
            Got it!
          </button>
        </div>
      </div>
    </div>
  );
};

export default Popup;