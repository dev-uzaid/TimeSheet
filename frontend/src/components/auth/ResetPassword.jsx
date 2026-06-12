import React, { useState, useEffect } from 'react';
import { Briefcase, Lock, CheckCircle, AlertCircle, ArrowLeft } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import logoImg from '../../assets/bhargava_logo.jpg';
import { BASE_URL } from '../../utils/api';


export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (!token) {
      setErrorMsg('Invalid request: password recovery token is missing.');
    }
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!token) return;

    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);
    setSuccessMsg('');
    setErrorMsg('');

    try {
      const res = await axios.post(`${BASE_URL}/auth/reset-password`, {
        token,
        password
      });
      setSuccessMsg(res.data?.message || 'Password updated successfully. You can now log in.');
      setPassword('');
      setConfirmPassword('');
    } catch (err) {
      console.error(err);
      setErrorMsg(err.response?.data?.message || err.message || 'Failed to reset password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="glass-panel login-card" style={{ maxWidth: '440px' }}>
        <div className="login-header">
          <img 
            src={logoImg} 
            alt="Bhargava & Co." 
            style={{ width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover', margin: '0 auto 16px', display: 'block', border: '3px solid rgba(255, 255, 255, 0.15)', boxShadow: '0 8px 20px rgba(0,0,0,0.4)' }} 
          />
          <h2>Reset Password</h2>
          <p>Choose a secure, new password for your account.</p>
        </div>

        {successMsg ? (
          <div style={{ textAlign: 'center', padding: '10px 0' }}>
            <div style={{ display: 'flex', justifyContent: 'center', color: '#10b981', marginBottom: '16px' }}>
              <CheckCircle size={48} />
            </div>
            <p style={{ color: 'var(--text-primary)', fontWeight: 500, fontSize: '0.95rem', marginBottom: '24px', lineHeight: 1.5 }}>
              {successMsg}
            </p>
            <Link to="/" className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 20px', textDecoration: 'none', justifyContent: 'center', width: '100%' }}>
              <ArrowLeft size={16} />
              Go to Sign In
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            {errorMsg && (
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', color: 'var(--danger)', background: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.2)', padding: '12px', borderRadius: '8px', marginBottom: '16px' }}>
                <AlertCircle size={18} style={{ flexShrink: 0 }} />
                <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{errorMsg}</span>
              </div>
            )}

            <div className="form-group">
              <label>New Password</label>
              <div style={{ position: 'relative' }}>
                <input 
                  type="password" 
                  className="form-control" 
                  required 
                  placeholder="••••••••" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{ paddingLeft: '40px', width: '100%' }}
                  disabled={!token}
                />
                <Lock size={16} style={{ position: 'absolute', left: '12px', top: '15px', color: 'var(--text-muted)' }} />
              </div>
            </div>

            <div className="form-group">
              <label>Confirm New Password</label>
              <div style={{ position: 'relative' }}>
                <input 
                  type="password" 
                  className="form-control" 
                  required 
                  placeholder="••••••••" 
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  style={{ paddingLeft: '40px', width: '100%' }}
                  disabled={!token}
                />
                <Lock size={16} style={{ position: 'absolute', left: '12px', top: '15px', color: 'var(--text-muted)' }} />
              </div>
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', height: '46px', marginTop: '8px' }} disabled={loading || !token}>
              {loading ? 'Saving Changes...' : 'Save New Password'}
            </button>

            <div style={{ textAlign: 'center', marginTop: '20px' }}>
              <Link to="/" style={{ color: 'var(--accent-primary)', textDecoration: 'none', fontSize: '0.875rem', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <ArrowLeft size={14} />
                Back to Login
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
