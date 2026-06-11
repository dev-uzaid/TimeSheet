import React, { useState, useEffect } from 'react';
import { Layout, Clock, Briefcase, ShieldAlert, Monitor, Users, Inbox, LogOut, Lock, Mail, Building, FileText } from 'lucide-react';
import { api, getStoredToken, getStoredUser, setStoredToken, setStoredUser, removeStoredToken, removeStoredUser } from '../../utils/api';

// Components
import {
  Dashboard,
  TimesheetModule,
  EngagementModule,
  ITAssetModule,
  DefaulterModule,
  NotificationInbox,
  ClientModule,
  WorkType
} from '../index';
import Employee from '../employee/Employee';

export default function Home() {
  const [token, setToken] = useState(getStoredToken());
  const [user, setUser] = useState(getStoredUser());
  const [activeScreen, setActiveScreen] = useState('dashboard');
  
  // Login form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loggingIn, setLoggingIn] = useState(false);

  // Global Notifications state
  const [notifications, setNotifications] = useState([]);
  const [notifLoading, setNotifLoading] = useState(false);

  // Poll notifications
  const fetchNotifications = async () => {
    if (!token) return;
    try {
      const data = await api.get('/notifications');
      setNotifications(data);
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    }
  };

  useEffect(() => {
    if (token) {
      fetchNotifications();
      // Setup periodic poll every 10 seconds
      const interval = setInterval(fetchNotifications, 10000);
      return () => clearInterval(interval);
    }
  }, [token]);

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      setLoginError('');
      setLoggingIn(true);
      const data = await api.post('/auth/login', { email, password });
      
      setStoredToken(data.token);
      setStoredUser(data);
      setToken(data.token);
      setUser(data);
      setActiveScreen('dashboard');
    } catch (err) {
      setLoginError(err.message || 'Login failed');
    } finally {
      setLoggingIn(false);
    }
  };

  const handleLogout = () => {
    removeStoredToken();
    removeStoredUser();
    setToken(null);
    setUser(null);
  };

  const handleMarkNotificationRead = async (id) => {
    try {
      await api.put(`/notifications/${id}/read`);
      fetchNotifications();
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllNotificationsRead = async () => {
    try {
      await api.put('/notifications/read-all');
      fetchNotifications();
    } catch (err) {
      console.error(err);
    }
  };

  const handlePreFill = (preEmail, prePass) => {
    setEmail(preEmail);
    setPassword(prePass);
  };

  // If not logged in, render the login page
  if (!token || !user) {
    return (
      <div className="login-container">
        <div className="glass-panel login-card">
          <div className="login-header">
            <div className="login-logo">
              <Briefcase size={48} />
            </div>
            <h2>Professional Services Hub</h2>
            <p>Sign in to manage timesheets and IT configurations</p>
          </div>

          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label>Corporate Email Address</label>
              <div style={{ position: 'relative' }}>
                <input 
                  type="email" 
                  className="form-control" 
                  required 
                  placeholder="name@firm.com" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{ paddingLeft: '40px', width: '100%' }}
                />
                <Mail size={16} style={{ position: 'absolute', left: '12px', top: '15px', color: 'var(--text-muted)' }} />
              </div>
            </div>

            <div className="form-group">
              <label>Password</label>
              <div style={{ position: 'relative' }}>
                <input 
                  type="password" 
                  className="form-control" 
                  required 
                  placeholder="••••••••" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{ paddingLeft: '40px', width: '100%' }}
                />
                <Lock size={16} style={{ position: 'absolute', left: '12px', top: '15px', color: 'var(--text-muted)' }} />
              </div>
            </div>

            {loginError && (
              <p className="stat-desc" style={{ color: 'var(--danger)', marginBottom: '16px', fontWeight: 600 }}>
                {loginError}
              </p>
            )}

            <button type="submit" className="btn btn-primary" style={{ width: '100%', height: '46px' }} disabled={loggingIn}>
              {loggingIn ? 'Authenticating...' : 'Sign In'}
            </button>
          </form>

          {/* Quick Demo Pre-fills */}
          <div style={{ marginTop: '24px', borderTop: '1px solid var(--border-color)', paddingTop: '20px' }}>
            <h4 style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '10px', fontWeight: 600 }}>Quick Demo Logins:</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <button 
                onClick={() => handlePreFill('admin@firm.com', 'admin123')} 
                className="btn btn-secondary btn-sm" 
                style={{ justifyContent: 'space-between', padding: '8px 12px', width: '100%' }}
              >
                <span>System Administrator (Admin)</span>
                <code style={{ fontSize: '0.75rem', color: 'var(--accent-primary)' }}>admin@firm.com</code>
              </button>
              <button 
                onClick={() => handlePreFill('manager@firm.com', 'manager123')} 
                className="btn btn-secondary btn-sm" 
                style={{ justifyContent: 'space-between', padding: '8px 12px', width: '100%' }}
              >
                <span>Reporting Manager (Manager)</span>
                <code style={{ fontSize: '0.75rem', color: 'var(--accent-primary)' }}>manager@firm.com</code>
              </button>
              <button 
                onClick={() => handlePreFill('staff1@firm.com', 'staff123')} 
                className="btn btn-secondary btn-sm" 
                style={{ justifyContent: 'space-between', padding: '8px 12px', width: '100%' }}
              >
                <span>Audit Associate (Staff)</span>
                <code style={{ fontSize: '0.75rem', color: 'var(--accent-primary)' }}>staff1@firm.com</code>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="app-container">
      {/* Sidebar Navigation */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <Briefcase size={24} />
          <h2>TimeSheet App</h2>
        </div>

        <ul className="nav-links">
          <li 
            className={`nav-item ${activeScreen === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveScreen('dashboard')}
          >
            <Layout size={18} />
            Dashboard
          </li>

          <li 
            className={`nav-item ${activeScreen === 'timesheets' ? 'active' : ''}`}
            onClick={() => setActiveScreen('timesheets')}
          >
            <Clock size={18} />
            Timesheet Desk
          </li>
         {(user.role === 'manager' || user.role === 'admin') && (
            <li 
              className={`nav-item ${activeScreen === 'employees' ? 'active' : ''}`}
              onClick={() => setActiveScreen('employees')}
            >
              <Briefcase size={18} />
              Employees
            </li>
          )}
          {(user.role === 'manager' || user.role === 'admin') && (
            <li 
              className={`nav-item ${activeScreen === 'clients' ? 'active' : ''}`}
              onClick={() => setActiveScreen('clients')}
            >
              <Building size={18} />
              Clients
            </li>
          )}
          {(user.role === 'manager' || user.role === 'admin') && (
            <li 
              className={`nav-item ${activeScreen === 'worktypes' ? 'active' : ''}`}
              onClick={() => setActiveScreen('worktypes')}
            >
              <FileText size={18} />
              Work Types
            </li>
          )}
          {(user.role === 'manager' || user.role === 'admin') && (
            <li 
              className={`nav-item ${activeScreen === 'engagements' ? 'active' : ''}`}
              onClick={() => setActiveScreen('engagements')}
            >
              <Briefcase size={18} />
              Engagements
            </li>
          )}

          <li 
            className={`nav-item ${activeScreen === 'assets' ? 'active' : ''}`}
            onClick={() => setActiveScreen('assets')}
          >
            <Monitor size={18} />
            IT Assets
          </li>

          {user.role === 'admin' && (
            <li 
              className={`nav-item ${activeScreen === 'defaulters' ? 'active' : ''}`}
              onClick={() => setActiveScreen('defaulters')}
            >
              <ShieldAlert size={18} />
              Defaulter Engine
            </li>
          )}

          <li 
            className={`nav-item ${activeScreen === 'notifications' ? 'active' : ''}`}
            onClick={() => setActiveScreen('notifications')}
            style={{ position: 'relative' }}
          >
            <Inbox size={18} />
            Alerts Inbox
            {unreadCount > 0 && <span className="notification-badge" />}
          </li>
        </ul>

        {/* Sidebar Footer User Details */}
        <div className="sidebar-user">
          <div className="user-info">
            <span className="user-name">{user.name}</span>
            <span className="user-role">{user.role}</span>
          </div>
          <button onClick={handleLogout} className="logout-btn" title="Logout Session">
            <LogOut size={18} />
          </button>
        </div>
      </aside>

      {/* Main Panel Content */}
      <main className="main-content">
        <header className="header">
          <div className="page-title">
            <h1 style={{ textTransform: 'capitalize' }}>
              {activeScreen === 'timesheets' ? 'Weekly Timesheets' : activeScreen === 'assets' ? 'IT Asset Management' : activeScreen === 'defaulters' ? 'Compliance Defaulters' : activeScreen === 'notifications' ? 'Alerts Inbox' : activeScreen}
            </h1>
          </div>
          <div className="header-actions">
            <button 
              className="notification-trigger" 
              onClick={() => setActiveScreen('notifications')}
              title="View system alerts"
            >
              <Inbox size={20} />
              {unreadCount > 0 && <span className="notification-badge" />}
            </button>
          </div>
        </header>

        <div className="content-body">
          {activeScreen === 'dashboard' && <Dashboard user={user} />}
          {activeScreen === 'timesheets' && <TimesheetModule user={user} />}
          {activeScreen==='employees'&&(user.role==='manager'||user.role==='admin')&&<Employee/>}
          {activeScreen === 'clients' && (user.role === 'manager' || user.role === 'admin') && <ClientModule />}
          {activeScreen === 'worktypes' && (user.role === 'manager' || user.role === 'admin') && <WorkType />}
          {activeScreen === 'engagements' && (user.role === 'manager' || user.role === 'admin') && <EngagementModule user={user} />}
          {activeScreen === 'assets' && <ITAssetModule user={user} />}
          {activeScreen === 'defaulters' && user.role === 'admin' && <DefaulterModule />}
          {activeScreen === 'notifications' && (
            <NotificationInbox 
              notifications={notifications} 
              onMarkRead={handleMarkNotificationRead}
              onMarkAllRead={handleMarkAllNotificationsRead}
              loading={notifLoading}
            />
          )}
        </div>
      </main>
    </div>
  );
}
