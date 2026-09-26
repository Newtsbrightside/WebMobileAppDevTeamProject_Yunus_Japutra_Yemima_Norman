import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { ArrowRight, LockKeyhole, Sparkles } from 'lucide-react';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const { login, error } = useAuth();

  const handleSubmit = (e) => {
    e.preventDefault();
    login(username, password);
  };

  return (
    <div className="login-page">
      <div className="login-visual"><div className="logo-placeholder">F<span>/</span></div><p>Built for the next<br /><strong>finish line.</strong></p><small>YOUR LOGO / TYPOGRAPHY AREA</small></div>
      <div className="login-panel animate-fade-in">
        <div className="eyebrow"><Sparkles size={15} /> MEMBER ACCESS</div>
        <h1>Welcome<br /><em>back.</em></h1>
        <p className="muted">Sign in to step into the Finishline edit.</p>
        
        {error && (
          <div style={{ backgroundColor: 'rgba(229, 57, 53, 0.1)', color: 'var(--primary-color)', padding: '0.75rem', borderRadius: '8px', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ textAlign: 'left' }}>
          <div className="form-group">
            <label className="form-label">Username</label>
            <input 
              type="text" 
              className="form-input" 
              value={username} 
              onChange={e => setUsername(e.target.value)} 
              placeholder="admin or client"
              required 
            />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input 
              type="password" 
              className="form-input" 
              value={password} 
              onChange={e => setPassword(e.target.value)} 
              placeholder="password"
              required 
            />
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }}>
            Enter Finishline <ArrowRight size={18} />
          </button>
        </form>

        <div className="demo-accounts">
          <LockKeyhole size={15} /><span>Demo access: <strong>admin</strong> or <strong>client</strong> / password</span>
        </div>
      </div>
    </div>
  );
};

export default Login;
