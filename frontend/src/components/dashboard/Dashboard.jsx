import React, { useState, useEffect } from 'react';
import { Clock, Briefcase, ShieldAlert, Monitor, Users, FileText, CheckCircle2, Building, MessageSquare, TrendingUp, Activity, ChevronRight, Shield, Bell } from 'lucide-react';
import { api } from '../../utils/api';

export default function Dashboard({ user, setActiveScreen }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [timesheets, engagements, assets, employees, clients, assetDashboard, companiesData] = await Promise.all([
        api.get('/timesheets'),
        api.get('/engagements'),
        api.get('/assets'),
        api.get('/employees').catch(() => []),
        api.get('/clients'),
        api.get('/assets/dashboard'),
        api.get('/companies').catch(() => ({ companies: [] }))
      ]);

      setStats({
        timesheets,
        engagements,
        assets,
        employees,
        clients,
        assetDashboard,
        companies: companiesData?.companies || []
      });
    } catch (err) {
      console.error(err);
    } finally {
      setStats(prev => prev || {});
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  if (loading || !stats) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '300px', color: 'var(--text-secondary)' }}>
        <p className="stat-desc">Loading Dashboard Widgets...</p>
      </div>
    );
  }

  // Formatting date
  const formatDate = () => {
    const options = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };
    return new Date().toLocaleDateString('en-GB', options);
  };

  // Staff calculations
  const myTS = stats.timesheets?.filter(t => t.employeeId?._id === user._id) || [];
  const myApprovedHours = myTS.filter(t => t.status === 'approved').reduce((acc, c) => acc + c.hours, 0);
  const mySubmittedHours = myTS.filter(t => t.status === 'submitted').reduce((acc, c) => acc + c.hours, 0);
  const myDraftHours = myTS.filter(t => t.status === 'draft').reduce((acc, c) => acc + c.hours, 0);
  const myQueriedHours = myTS.filter(t => t.status === 'queried').reduce((acc, c) => acc + c.hours, 0);
  const myTotalHours = myApprovedHours + mySubmittedHours + myDraftHours + myQueriedHours;
  const myAssets = stats.assets?.filter(a => a.currentUserId?._id === user._id) || [];
  const myActiveProjects = stats.engagements?.filter(e => e.assignedStaff?.some(s => s === user._id || s._id === user._id)) || [];

  // Admin/Manager calculations
  const pendingTS = stats.timesheets?.filter(t => t.status === 'submitted') || [];
  const queriedTS = stats.timesheets?.filter(t => t.status === 'queried') || [];
  const approvedHours = stats.timesheets?.filter(t => t.status === 'approved').reduce((acc, t) => acc + t.hours, 0) || 0;

  const companiesCount = stats.companies?.length || 0;
  const employeesCount = stats.employees?.length || 0;
  const clientsCount = stats.clients?.length || 0;
  const pendingApprovalsCount = pendingTS.length;
  const openQueriesCount = queriedTS.length;

  // Render Actions list
  const quickActions = [
    {
      title: "Work in Progress",
      desc: "Monitor all ongoing client engagements",
      icon: <Activity size={20} style={{ color: "#3b82f6" }} />,
      bg: "rgba(59, 130, 246, 0.15)",
      screen: "engagements",
      roles: ["admin", "manager"]
    },
    {
      title: "My Timesheets",
      desc: "Log and manage your daily hours",
      icon: <Clock size={20} style={{ color: "#6366f1" }} />,
      bg: "rgba(99, 102, 241, 0.15)",
      screen: "timesheets",
      roles: ["admin", "manager", "staff"]
    },
    {
      title: "Approvals",
      desc: "Review and approve subordinate logs",
      icon: <CheckCircle2 size={20} style={{ color: "#f59e0b" }} />,
      bg: "rgba(245, 158, 11, 0.15)",
      screen: "timesheets", 
      roles: ["admin", "manager"]
    },
    {
      title: "All Timesheets",
      desc: "View all employee timesheet records",
      icon: <FileText size={20} style={{ color: "#3b82f6" }} />,
      bg: "rgba(59, 130, 246, 0.15)",
      screen: "workreport",
      roles: ["admin", "manager"]
    },
    {
      title: "Timesheet Queries",
      desc: "Ask questions about timesheet records",
      icon: <MessageSquare size={20} style={{ color: "#ef4444" }} />,
      bg: "rgba(239, 68, 68, 0.15)",
      screen: "timesheets",
      roles: ["admin", "manager"]
    },
    {
      title: "Employees",
      desc: "Add and manage staff records",
      icon: <Users size={20} style={{ color: "#a855f7" }} />,
      bg: "rgba(168, 85, 247, 0.15)",
      screen: "employees",
      roles: ["admin", "manager"]
    },
    {
      title: "Departments",
      desc: "Manage your company departments",
      icon: <Building size={20} style={{ color: "#14b8a6" }} />,
      bg: "rgba(20, 184, 166, 0.15)",
      screen: "company",
      roles: ["admin", "manager"]
    },
    {
      title: "Clients",
      desc: "Manage client and project portfolios",
      icon: <Briefcase size={20} style={{ color: "#10b981" }} />,
      bg: "rgba(16, 185, 129, 0.15)",
      screen: "clients",
      roles: ["admin", "manager"]
    },
    {
      title: "Work Types",
      desc: "Configure billable work categories",
      icon: <FileText size={20} style={{ color: "#f59e0b" }} />,
      bg: "rgba(245, 158, 11, 0.15)",
      screen: "worktypes",
      roles: ["admin", "manager"]
    },
    {
      title: "Company Management",
      desc: "Register and update company profiles",
      icon: <Building size={20} style={{ color: "#64748b" }} />,
      bg: "rgba(100, 116, 139, 0.15)",
      screen: "company",
      roles: ["admin", "manager"]
    },
    {
      title: "Company Roles",
      desc: "Define custom roles like Partner or Lead",
      icon: <Shield size={20} style={{ color: "#a855f7" }} />,
      bg: "rgba(168, 85, 247, 0.15)",
      screen: "employees",
      roles: ["admin", "manager"]
    },
    {
      title: "Issued Assets",
      desc: "View and manage company devices",
      icon: <Monitor size={20} style={{ color: "#f59e0b" }} />,
      bg: "rgba(245, 158, 11, 0.15)",
      screen: "assets",
      roles: ["staff"]
    },
    {
      title: "System Alerts",
      desc: "Check recent system notifications",
      icon: <Bell size={20} style={{ color: "#ef4444" }} />,
      bg: "rgba(239, 68, 68, 0.15)",
      screen: "notifications",
      roles: ["staff"]
    }
  ];

  const filteredActions = quickActions.filter(act => act.roles.includes(user.role));

  // ==========================================
  // STAFF USER DASHBOARD VIEW
  // ==========================================
  if (user.role === 'staff') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Dashboard Top Header row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', margin: 0 }}>
              Welcome back, <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{user.name}</span>. Here's your personal timesheet overview.
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: 500 }}>
              {formatDate()}
            </span>
            <div 
              onClick={() => setActiveScreen('notifications')}
              style={{ 
                position: 'relative', 
                cursor: 'pointer',
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-color)',
                borderRadius: '50%',
                width: '40px',
                height: '40px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: 'var(--shadow-sm)'
              }}
            >
              <Bell size={18} style={{ color: 'var(--text-secondary)' }} />
              {myQueriedHours > 0 && (
                <span style={{
                  position: 'absolute',
                  top: '10px',
                  right: '10px',
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: 'var(--danger)'
                }} />
              )}
            </div>
          </div>
        </div>

        {/* Metric cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '20px',
          marginBottom: '8px'
        }}>
          {/* Total Hours Card */}
          <div className="glass-panel" style={{
            padding: '24px',
            display: 'flex',
            alignItems: 'center',
            gap: '20px'
          }}>
            <div style={{
              background: 'rgba(59, 130, 246, 0.15)',
              borderRadius: '12px',
              width: '52px',
              height: '52px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <Clock size={24} style={{ color: '#3b82f6' }} />
            </div>
            <div>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.1 }}>{myTotalHours} hrs</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 500, marginTop: '4px' }}>
                Approved: {myApprovedHours} | Draft: {myDraftHours} | Queried: {myQueriedHours}
              </div>
            </div>
          </div>

          {/* Active Projects Card */}
          <div className="glass-panel" style={{
            padding: '24px',
            display: 'flex',
            alignItems: 'center',
            gap: '20px'
          }}>
            <div style={{
              background: 'rgba(16, 185, 129, 0.15)',
              borderRadius: '12px',
              width: '52px',
              height: '52px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <Briefcase size={24} style={{ color: '#10b981' }} />
            </div>
            <div>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.1 }}>{myActiveProjects.length}</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 500, marginTop: '4px' }}>Active Projects</div>
            </div>
          </div>

          {/* Issued Assets Card */}
          <div className="glass-panel" style={{
            padding: '24px',
            display: 'flex',
            alignItems: 'center',
            gap: '20px'
          }}>
            <div style={{
              background: 'rgba(245, 158, 11, 0.15)',
              borderRadius: '12px',
              width: '52px',
              height: '52px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <Monitor size={24} style={{ color: '#f59e0b' }} />
            </div>
            <div>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.1 }}>{myAssets.length}</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 500, marginTop: '4px' }}>Issued IT Devices</div>
            </div>
          </div>
        </div>

        {/* Quick Actions Title */}
        <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '8px' }}>Quick Actions</h3>

        {/* Quick Actions Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
          gap: '16px',
          marginBottom: '8px'
        }}>
          {filteredActions.map((action, i) => (
            <div 
              key={i}
              onClick={() => setActiveScreen(action.screen)}
              className="glass-panel"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '16px 20px',
                cursor: 'pointer'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', minWidth: 0 }}>
                <div style={{
                  background: action.bg,
                  borderRadius: '10px',
                  width: '40px',
                  height: '40px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  {action.icon}
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: '0.92rem', fontWeight: 600, color: 'var(--text-primary)' }}>{action.title}</div>
                  <div style={{
                    fontSize: '0.78rem',
                    color: 'var(--text-muted)',
                    marginTop: '1px',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    maxWidth: '170px'
                  }}>{action.desc}</div>
                </div>
              </div>
              <ChevronRight size={16} style={{ color: 'var(--text-muted)', marginLeft: '8px', flexShrink: 0 }} />
            </div>
          ))}
        </div>

        {/* Split Section: Recent Project Assignments & Timesheet Log Status */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
          gap: '24px'
        }}>
          {/* Recent Projects */}
          <div className="glass-panel" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '20px' }}>Recent Project Assignments</h3>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {myActiveProjects.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', textAlign: 'center', padding: '32px 0', margin: 0 }}>
                  No projects assigned.
                </p>
              ) : (
                myActiveProjects.slice(0, 4).map((proj, idx) => (
                  <div 
                    key={proj._id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '14px 0',
                      borderBottom: idx === myActiveProjects.slice(0, 4).length - 1 ? 'none' : '1px solid var(--border-color)'
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '0.92rem', fontWeight: 600, color: 'var(--text-primary)' }}>{proj.name}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                        Client: {proj.clientId?.name || 'External'} &bull; Due: {new Date(proj.dueDate).toLocaleDateString()}
                      </div>
                    </div>
                    <span style={{
                      fontSize: '0.78rem',
                      fontWeight: 600,
                      padding: '4px 10px',
                      borderRadius: '12px',
                      background: 'rgba(59, 130, 246, 0.15)',
                      color: '#3b82f6',
                      textTransform: 'capitalize'
                    }}>
                      {proj.status.replace(/_/g, ' ')}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Timesheet Log Status */}
          <div className="glass-panel" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '20px' }}>Recent Timesheet Logs</h3>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {myTS.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', textAlign: 'center', padding: '32px 0', margin: 0 }}>
                  No timesheet logging details available.
                </p>
              ) : (
                myTS.slice(0, 4).map((ts, idx) => (
                  <div 
                    key={ts._id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '14px 0',
                      borderBottom: idx === myTS.slice(0, 4).length - 1 ? 'none' : '1px solid var(--border-color)'
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '0.92rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                        {ts.engagementId?.name || 'Logged Hours'}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                        {ts.date} &bull; {ts.hours} hrs
                      </div>
                    </div>
                    <span style={{
                      fontSize: '0.78rem',
                      fontWeight: 600,
                      padding: '4px 10px',
                      borderRadius: '12px',
                      background: 
                        ts.status === 'approved' ? 'rgba(16, 185, 129, 0.15)' : 
                        ts.status === 'queried' ? 'rgba(239, 68, 68, 0.15)' : 
                        ts.status === 'submitted' ? 'rgba(245, 158, 11, 0.15)' : 'rgba(100, 116, 139, 0.15)',
                      color: 
                        ts.status === 'approved' ? '#10b981' : 
                        ts.status === 'queried' ? '#ef4444' : 
                        ts.status === 'submitted' ? '#f59e0b' : 'var(--text-secondary)'
                    }}>
                      {ts.status}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // MANAGER/ADMIN VIEW (Matches screenshot layout with app color theme)
  // ==========================================
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Dashboard Top Header row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
        <div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', margin: 0 }}>
            Welcome back, <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{user.name}</span>. Here's your organization overview.
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: 500 }}>
            {formatDate()}
          </span>
          <div 
            onClick={() => setActiveScreen('notifications')}
            style={{ 
              position: 'relative', 
              cursor: 'pointer',
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
              borderRadius: '50%',
              width: '40px',
              height: '40px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: 'var(--shadow-sm)'
            }}
          >
            <Bell size={18} style={{ color: 'var(--text-secondary)' }} />
            {(pendingApprovalsCount > 0 || openQueriesCount > 0) && (
              <span style={{
                position: 'absolute',
                top: '10px',
                right: '10px',
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: 'var(--danger)'
              }} />
            )}
          </div>
        </div>
      </div>

      {/* Metric KPI cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
        gap: '16px',
        marginBottom: '8px'
      }}>
        {/* Companies Card */}
        <div className="glass-panel" style={{
          padding: '20px 24px',
          display: 'flex',
          alignItems: 'center',
          gap: '16px'
        }}>
          <div style={{
            background: 'rgba(59, 130, 246, 0.15)',
            borderRadius: '12px',
            width: '48px',
            height: '48px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <Building size={22} style={{ color: '#3b82f6' }} />
          </div>
          <div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.1 }}>{companiesCount}</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 500, marginTop: '2px' }}>Companies</div>
          </div>
        </div>

        {/* Employees Card */}
        <div className="glass-panel" style={{
          padding: '20px 24px',
          display: 'flex',
          alignItems: 'center',
          gap: '16px'
        }}>
          <div style={{
            background: 'rgba(168, 85, 247, 0.15)',
            borderRadius: '12px',
            width: '48px',
            height: '48px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <Users size={22} style={{ color: '#a855f7' }} />
          </div>
          <div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.1 }}>{employeesCount}</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 500, marginTop: '2px' }}>Employees</div>
          </div>
        </div>

        {/* Clients Card */}
        <div className="glass-panel" style={{
          padding: '20px 24px',
          display: 'flex',
          alignItems: 'center',
          gap: '16px'
        }}>
          <div style={{
            background: 'rgba(16, 185, 129, 0.15)',
            borderRadius: '12px',
            width: '48px',
            height: '48px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <Briefcase size={22} style={{ color: '#10b981' }} />
          </div>
          <div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.1 }}>{clientsCount}</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 500, marginTop: '2px' }}>Clients</div>
          </div>
        </div>

        {/* Pending Approvals Card */}
        <div className="glass-panel" style={{
          padding: '20px 24px',
          display: 'flex',
          alignItems: 'center',
          gap: '16px'
        }}>
          <div style={{
            background: 'rgba(245, 158, 11, 0.15)',
            borderRadius: '12px',
            width: '48px',
            height: '48px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <Clock size={22} style={{ color: '#f59e0b' }} />
          </div>
          <div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.1 }}>{pendingApprovalsCount}</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 500, marginTop: '2px' }}>Pending Approvals</div>
          </div>
        </div>

        {/* Open Queries Card */}
        <div className="glass-panel" style={{
          padding: '20px 24px',
          display: 'flex',
          alignItems: 'center',
          gap: '16px'
        }}>
          <div style={{
            background: 'rgba(239, 68, 68, 0.15)',
            borderRadius: '12px',
            width: '48px',
            height: '48px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <MessageSquare size={22} style={{ color: '#ef4444' }} />
          </div>
          <div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.1 }}>{openQueriesCount}</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 500, marginTop: '2px' }}>Open Queries</div>
          </div>
        </div>

        {/* Approved Hours Card */}
        <div className="glass-panel" style={{
          padding: '20px 24px',
          display: 'flex',
          alignItems: 'center',
          gap: '16px'
        }}>
          <div style={{
            background: 'rgba(20, 184, 166, 0.15)',
            borderRadius: '12px',
            width: '48px',
            height: '48px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <TrendingUp size={22} style={{ color: '#14b8a6' }} />
          </div>
          <div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.1 }}>{approvedHours.toFixed(1)}</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 500, marginTop: '2px' }}>Approved Hours</div>
          </div>
        </div>
      </div>

      {/* Quick Actions Title */}
      <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '8px' }}>Quick Actions</h3>

      {/* Quick Actions Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
        gap: '16px',
        marginBottom: '8px'
      }}>
        {filteredActions.map((action, i) => (
          <div 
            key={i}
            onClick={() => setActiveScreen(action.screen)}
            className="glass-panel"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '16px 20px',
              cursor: 'pointer'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', minWidth: 0 }}>
              <div style={{
                background: action.bg,
                borderRadius: '10px',
                width: '40px',
                height: '40px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                {action.icon}
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: '0.92rem', fontWeight: 600, color: 'var(--text-primary)' }}>{action.title}</div>
                <div style={{
                  fontSize: '0.78rem',
                  color: 'var(--text-muted)',
                  marginTop: '1px',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  maxWidth: '170px'
                }}>{action.desc}</div>
              </div>
            </div>
            <ChevronRight size={16} style={{ color: 'var(--text-muted)', marginLeft: '8px', flexShrink: 0 }} />
          </div>
        ))}
      </div>

      {/* Split section: Pending Approvals & Open Queries */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
        gap: '24px'
      }}>
        {/* Pending Approvals */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>Pending Approvals</h3>
            <span 
              onClick={() => setActiveScreen('timesheets')}
              style={{ fontSize: '0.85rem', color: 'var(--accent-primary)', fontWeight: 600, cursor: 'pointer' }}
            >
              View all &rarr;
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {pendingTS.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', textAlign: 'center', padding: '32px 0', margin: 0 }}>
                No timesheets awaiting review.
              </p>
            ) : (
              pendingTS.slice(0, 4).map((ts, idx) => (
                <div 
                  key={ts._id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '14px 0',
                    borderBottom: idx === pendingTS.slice(0, 4).length - 1 ? 'none' : '1px solid var(--border-color)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                      background: 'rgba(245, 158, 11, 0.15)',
                      color: 'var(--warning)',
                      borderRadius: '50%',
                      width: '38px',
                      height: '38px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.9rem',
                      fontWeight: 600,
                      flexShrink: 0
                    }}>
                      <Clock size={16} />
                    </div>
                    <div>
                      <div style={{ fontSize: '0.92rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                        {ts.employeeId?.name || 'Staff Member'}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                        {ts.date} &bull; {ts.engagementId?.clientId?.name || 'Client'} &bull; {ts.engagementId?.name || 'Engagement'}
                      </div>
                    </div>
                  </div>
                  <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--warning)' }}>
                    {ts.hours}h
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Open Queries */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>Open Queries</h3>
            <span 
              onClick={() => setActiveScreen('timesheets')}
              style={{ fontSize: '0.85rem', color: 'var(--accent-primary)', fontWeight: 600, cursor: 'pointer' }}
            >
              View all &rarr;
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {queriedTS.length === 0 ? (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '150px' }}>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem', textAlign: 'center', margin: 0 }}>
                  No open queries
                </p>
              </div>
            ) : (
              queriedTS.slice(0, 4).map((ts, idx) => (
                <div 
                  key={ts._id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '14px 0',
                    borderBottom: idx === queriedTS.slice(0, 4).length - 1 ? 'none' : '1px solid var(--border-color)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                      background: 'rgba(239, 68, 68, 0.15)',
                      color: 'var(--danger)',
                      borderRadius: '50%',
                      width: '38px',
                      height: '38px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.9rem',
                      fontWeight: 600,
                      flexShrink: 0
                    }}>
                      <MessageSquare size={16} />
                    </div>
                    <div>
                      <div style={{ fontSize: '0.92rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                        {ts.employeeId?.name || 'Staff Member'}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                        {ts.date} &bull; {ts.engagementId?.clientId?.name || 'Client'} &bull; {ts.engagementId?.name || 'Engagement'}
                      </div>
                    </div>
                  </div>
                  <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--danger)' }}>
                    {ts.hours}h
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
