import React, { useState } from 'react';
import { Music, Lock, Mail, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import './Auth.css';

const Auth = () => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    try {
      await login(email, password);
      // App.jsx will automatically redirect when user state changes
    } catch (err) {
      setError(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-bg-glow"></div>
      <div className="auth-card glass animate-fade-in">
        <div className="auth-header">
          <div className="auth-logo">
            <Music color="var(--primary)" size={40} />
          </div>
          <h2>Welcome to Muse</h2>
          <p className="text-muted">Sign in or create an account</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          {error && <div className="auth-error animate-fade-in">{error}</div>}
          
          <div className="input-group">
            <Mail size={20} className="input-icon" />
            <input 
              type="email" 
              placeholder="Email address" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required 
            />
          </div>

          <div className="input-group">
            <Lock size={20} className="input-icon" />
            <input 
              type="password" 
              placeholder="Password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required 
            />
          </div>

          <button type="submit" className="auth-btn" disabled={isLoading}>
            {isLoading ? 'Authenticating...' : 'Continue'} 
            {!isLoading && <ArrowRight size={20} />}
          </button>
        </form>

        <p className="auth-footer text-muted">
          By continuing, you agree to Muse's Terms of Service and Privacy Policy.
        </p>
      </div>
    </div>
  );
};

export default Auth;
