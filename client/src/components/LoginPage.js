import React from 'react';
import './LoginPage.css';

const LoginPage = () => {

  const handleGoogleLogin = () => {
    // Redirect to the backend Google auth route
    window.location.href = 'http://localhost:5001/auth/google';
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <h2>Login</h2>
        <p>Please log in with your Google account to continue.</p>
        <button onClick={handleGoogleLogin} className="login-btn google-btn">
          Sign In with Google
        </button>
      </div>
    </div>
  );
};

export default LoginPage;
