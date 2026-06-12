import React, { useState, useEffect } from 'react';
import { Layout, Clock, Briefcase, ShieldAlert, Monitor, Users, Inbox, LogOut, Lock, Mail, Building, FileText, ChevronDown, ChevronUp, Cpu, History, CheckCircle2, CheckSquare, MessageSquare } from 'lucide-react';
import { api, getStoredToken, getStoredUser, setStoredToken, setStoredUser, removeStoredToken, removeStoredUser } from '../../utils/api';
import { Link } from 'react-router-dom';
import logoImg from '../../assets/bhargava_logo.jpg';


// Components
import {
  Dashboard,
  TimesheetModule,
  EngagementModule,
  ITAssetModule,
  DefaulterModule,
  NotificationInbox,
  ClientModule,
  WorkType,
  WorkInProgress,
  ClientTimeSummary
} from '../index';
import Employee from '../employee/Employee';
import EmployeeWorkReport from '../EmployeeWorkReport/EmployeeWorkReport';
import Company from '../company/Company';

export default function Home() {
  const [token, setToken] = useState(getStoredToken());
  const [user, setUser] = useState(getStoredUser());
  const [activeScreen, setActiveScreen] = useState('dashboard');
  const [timeMenuOpen, setTimeMenuOpen] = useState(true);
  const [assetMenuOpen, setAssetMenuOpen] = useState(true);
  
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
            <img 
              src={logoImg} 
              alt="Bhargava & Co." 
              style={{ width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover', margin: '0 auto 16px', display: 'block', border: '3px solid rgba(255, 255, 255, 0.15)', boxShadow: '0 8px 20px rgba(0,0,0,0.4)' }} 
            />
            <h2>Bhargava & Co.</h2>
            <p>Chartered Accountants - Timesheet Management</p>
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
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <label style={{ marginBottom: 0 }}>Password</label>
                <Link to="/forgot-password" style={{ fontSize: '0.8rem', color: 'var(--accent-primary)', textDecoration: 'none', fontWeight: 500 }}>
                  Forgot Password?
                </Link>
              </div>
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
        <div className="sidebar-logo-container" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '0 8px 24px 8px', borderBottom: '1px solid var(--border-color)', marginBottom: '16px' }}>
          <img 
            src={logoImg} 
            alt="Logo" 
            style={{ width: '42px', height: '42px', borderRadius: '50%', objectFit: 'cover', border: '2px solid rgba(255, 255, 255, 0.15)', boxShadow: '0 4px 10px rgba(0,0,0,0.3)' }} 
          />
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '0.02em', textTransform: 'uppercase', fontFamily: "'Outfit', sans-serif" }}>
              Bhargava & Co
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 500, letterSpacing: '0.01em' }}>
              Timesheet management
            </span>
          </div>
        </div>

        <ul className="nav-links " style={{overflowY: "auto",maxHeight: "100vh",  scrollbarWidth: "none",msOverflowStyle: "none"}}>
          {user.role === 'manager' ? (
            <>
              <li 
                className={`nav-item ${activeScreen === 'dashboard' ? 'active' : ''}`}
                onClick={() => setActiveScreen('dashboard')}
              >
                <Layout size={16} />
                Dashboard
              </li>

              <li 
                className={`nav-item ${activeScreen === 'my-timesheets' ? 'active' : ''}`}
                onClick={() => setActiveScreen('my-timesheets')}
              >
                <Clock size={16} />
                My Timesheets
              </li>

              <li 
                className={`nav-item ${activeScreen === 'approvals-screen' ? 'active' : ''}`}
                onClick={() => setActiveScreen('approvals-screen')}
              >
                <CheckCircle2 size={16} />
                Approvals
              </li>

              <li 
                className={`nav-item ${activeScreen === 'queries-screen' ? 'active' : ''}`}
                onClick={() => setActiveScreen('queries-screen')}
              >
                <MessageSquare size={16} />
                Timesheet Queries
              </li>

              <li 
                className={`nav-item ${activeScreen === 'clients' ? 'active' : ''}`}
                onClick={() => setActiveScreen('clients')}
              >
                <Building size={16} />
                Clients
              </li>

              <li 
                className={`nav-item ${activeScreen === 'engagements' ? 'active' : ''}`}
                onClick={() => setActiveScreen('engagements')}
              >
                <CheckSquare size={16} />
                Engagements
              </li>

              <li 
                className={`nav-item ${activeScreen === 'workreport' ? 'active' : ''}`}
                onClick={() => setActiveScreen('workreport')}
              >
                <Users size={16} />
                Employee Work Report
              </li>

              <li 
                className={`nav-item ${activeScreen === 'wip' ? 'active' : ''}`}
                onClick={() => setActiveScreen('wip')}
              >
                <Clock size={16} />
                Work in Progress
              </li>

              <li 
                className={`nav-item ${activeScreen === 'client-time-summary' ? 'active' : ''}`}
                onClick={() => setActiveScreen('client-time-summary')}
              >
                <Clock size={16} />
                Client Time Summary
              </li>
            </>
          ) : (
            <>
              {/* TIME MANAGEMENT SECTION */}
              <li 
                className="nav-item-header" 
                onClick={() => setTimeMenuOpen(!timeMenuOpen)}
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between', 
                  padding: '12px 16px', 
                  color: 'var(--text-secondary)', 
                  fontWeight: 700, 
                  fontSize: '0.8rem', 
                  letterSpacing: '0.05em', 
                  textTransform: 'uppercase',
                  cursor: 'pointer',
                  marginTop: '12px'
                }}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Clock size={16} />
                  Time Management
                </span>
                {timeMenuOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </li>
            </>
          )}

          {user.role !== 'manager' && timeMenuOpen && (
            <>
              <li 
                className={`nav-item ${activeScreen === 'dashboard' ? 'active' : ''}`}
                onClick={() => setActiveScreen('dashboard')}
                style={{ paddingLeft: '28px' }}
              >
                <Layout size={16} />
                Dashboard
              </li>

              <li 
                className={`nav-item ${activeScreen === 'timesheets' ? 'active' : ''}`}
                onClick={() => setActiveScreen('timesheets')}
                style={{ paddingLeft: '28px' }}
              >
                <Clock size={16} />
                Timesheet Desk
              </li>

              {(user.role === 'manager' || user.role === 'admin') && (
                <li 
                  className={`nav-item ${activeScreen === 'employees' ? 'active' : ''}`}
                  onClick={() => setActiveScreen('employees')}
                  style={{ paddingLeft: '28px' }}
                >
                  <Users size={16} />
                  Employees
                </li>
              )}
              {(user.role === 'manager' || user.role === 'admin') && (
                <li 
                  className={`nav-item ${activeScreen === 'workreport' ? 'active' : ''}`}
                  onClick={() => setActiveScreen('workreport')}
                  style={{ paddingLeft: '28px' }}
                >
                  <FileText size={16} />
                  Work Report
                </li>
              )}
              {(user.role === 'manager' || user.role === 'admin') && (
                <li 
                  className={`nav-item ${activeScreen === 'clients' ? 'active' : ''}`}
                  onClick={() => setActiveScreen('clients')}
                  style={{ paddingLeft: '28px' }}
                >
                  <Building size={16} />
                  Clients
                </li>
              )}
              {(user.role === 'manager' || user.role === 'admin') && (
                <li 
                  className={`nav-item ${activeScreen === 'worktypes' ? 'active' : ''}`}
                  onClick={() => setActiveScreen('worktypes')}
                  style={{ paddingLeft: '28px' }}
                >
                  <FileText size={16} />
                  Work Types
                </li>
              )}
              {(user.role === 'manager' || user.role === 'admin') && (
                <li 
                  className={`nav-item ${activeScreen === 'engagements' ? 'active' : ''}`}
                  onClick={() => setActiveScreen('engagements')}
                  style={{ paddingLeft: '28px' }}
                >
                  <Briefcase size={16} />
                  Engagements
                </li>
              )}
              {(user.role === 'manager' || user.role === 'admin') && (
                <li 
                  className={`nav-item ${activeScreen === 'company' ? 'active' : ''}`}
                  onClick={() => setActiveScreen('company')}
                  style={{ paddingLeft: '28px' }}
                >
                  <Building size={16} />
                  Company
                </li>
              )}
              {user.role === 'admin' && (
                <li 
                  className={`nav-item ${activeScreen === 'defaulters' ? 'active' : ''}`}
                  onClick={() => setActiveScreen('defaulters')}
                  style={{ paddingLeft: '28px' }}
                >
                  <ShieldAlert size={16} />
                  Defaulter Engine
                </li>
              )}

              <li 
                className={`nav-item ${activeScreen === 'notifications' ? 'active' : ''}`}
                onClick={() => setActiveScreen('notifications')}
                style={{ paddingLeft: '28px' }}
              >
                <Inbox size={16} />
                Alerts Inbox
                {unreadCount > 0 && <span className="notification-badge" />}
              </li>
            </>
          )}

          {/* ASSET MANAGEMENT SECTION */}
          {user.role !== 'manager' && (
            <>
              <li 
                className="nav-item-header" 
                onClick={() => setAssetMenuOpen(!assetMenuOpen)}
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between', 
                  padding: '12px 16px', 
                  color: 'var(--text-secondary)', 
                  fontWeight: 700, 
                  fontSize: '0.8rem', 
                  letterSpacing: '0.05em', 
                  textTransform: 'uppercase',
                  cursor: 'pointer',
                  marginTop: '12px'
                }}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Monitor size={16} />
                  Asset Management
                </span>
                {assetMenuOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </li>

              {assetMenuOpen && (
                <>
                  <li 
                    className={`nav-item ${activeScreen === 'asset-dashboard' ? 'active' : ''}`}
                    onClick={() => setActiveScreen('asset-dashboard')}
                    style={{ paddingLeft: '28px' }}
                  >
                    <Monitor size={16} />
                    Asset Dashboard
                  </li>

                  <li 
                    className={`nav-item ${activeScreen === 'asset-inventory' ? 'active' : ''}`}
                    onClick={() => setActiveScreen('asset-inventory')}
                    style={{ paddingLeft: '28px' }}
                  >
                    <Monitor size={16} />
                    Asset Inventory
                  </li>

                  <li 
                    className={`nav-item ${activeScreen === 'asset-history' ? 'active' : ''}`}
                    onClick={() => setActiveScreen('asset-history')}
                    style={{ paddingLeft: '28px' }}
                  >
                    <History size={16} />
                    Asset History
                  </li>

                  <li 
                    className={`nav-item ${activeScreen === 'hardware-configs' ? 'active' : ''}`}
                    onClick={() => setActiveScreen('hardware-configs')}
                    style={{ paddingLeft: '28px' }}
                  >
                    <Cpu size={16} />
                    Hardware Configs
                  </li>

                  <li 
                    className={`nav-item ${activeScreen === 'asset-reports' ? 'active' : ''}`}
                    onClick={() => setActiveScreen('asset-reports')}
                    style={{ paddingLeft: '28px' }}
                  >
                    <FileText size={16} />
                    Asset Reports
                  </li>
                </>
              )}
            </>
          )}

          {/* GLOBAL FLAT ACTIONS */}
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
        {activeScreen !== 'dashboard' && (
          <header className="header">
            <div className="page-title">
              <h1 style={{ textTransform: 'capitalize' }}>
                {activeScreen === 'timesheets' ? 'Weekly Timesheets' : 
                 (activeScreen === 'assets' || activeScreen.startsWith('asset-') || activeScreen === 'hardware-configs') ? 'IT Asset Management' : 
                 activeScreen === 'defaulters' ? 'Compliance Defaulters' : 
                 activeScreen === 'notifications' ? 'Alerts Inbox' : 
                 activeScreen}
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
        )}

        <div className="content-body">
          {activeScreen === 'dashboard' && <Dashboard user={user} setActiveScreen={setActiveScreen} />}
          {activeScreen === 'timesheets' && <TimesheetModule user={user} />}
          {activeScreen === 'my-timesheets' && <TimesheetModule user={user} initialTab="entries" />}
          {activeScreen === 'approvals-screen' && <TimesheetModule key="approvals-mod" user={user} initialTab="approvals" />}
          {activeScreen === 'queries-screen' && <TimesheetModule key="queries-mod" user={user} initialTab="queries" />}
          {activeScreen==='employees'&&(user.role==='manager'||user.role==='admin')&&<Employee/>}
          {activeScreen==='workreport'&&(user.role==='manager'||user.role==='admin')&&<EmployeeWorkReport/>}
          {activeScreen === 'clients' && (user.role === 'manager' || user.role === 'admin') && <ClientModule />}
          {activeScreen === 'wip' && <WorkInProgress />}
          {activeScreen === 'client-time-summary' && <ClientTimeSummary />}
          {activeScreen === 'worktypes' && (user.role === 'manager' || user.role === 'admin') && <WorkType />}
          {activeScreen === 'engagements' && (user.role === 'manager' || user.role === 'admin') && <EngagementModule user={user} />}
          {activeScreen ==='company'&&(user.role==='manager'||user.role==='admin')&&<Company/>}
          {(activeScreen === 'assets' || activeScreen.startsWith('asset-') || activeScreen === 'hardware-configs') && (
            <ITAssetModule user={user} subScreen={activeScreen} />
          )}
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
