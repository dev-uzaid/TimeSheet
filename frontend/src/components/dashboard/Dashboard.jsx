import React, { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend, Cell, PieChart, Pie } from 'recharts';
import { Clock, Briefcase, ShieldAlert, Monitor, Users, FileText, CheckCircle2, DollarSign } from 'lucide-react';
import { api } from '../../utils/api';

export default function Dashboard({ user }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch required records to aggregate statistics dynamically
      const [timesheets, engagements, assets, employees, clients, assetDashboard] = await Promise.all([
        api.get('/timesheets'),
        api.get('/engagements'),
        api.get('/assets'),
        api.get('/employees').catch(() => []), // staff might fail on this endpoint due to role restriction, fallback
        api.get('/clients'),
        api.get('/assets/dashboard')
      ]);

      const data = {
        timesheets,
        engagements,
        assets,
        employees,
        clients,
        assetDashboard
      };

      setStats(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  if (loading || !stats) {
    return <p className="stat-desc" style={{ textAlign: 'center', padding: '32px' }}>Loading Dashboard Widgets...</p>;
  }

  // ==========================================
  // STAFF USER DASHBOARD
  // ==========================================
  if (user.role === 'staff') {
    const myTS = stats.timesheets.filter(t => t.employeeId?._id === user._id);
    const approvedHours = myTS.filter(t => t.status === 'approved').reduce((acc, c) => acc + c.hours, 0);
    const submittedHours = myTS.filter(t => t.status === 'submitted').reduce((acc, c) => acc + c.hours, 0);
    const draftHours = myTS.filter(t => t.status === 'draft').reduce((acc, c) => acc + c.hours, 0);
    const totalHours = approvedHours + submittedHours + draftHours;

    const myAssets = stats.assets.filter(a => a.currentUserId?._id === user._id);
    const activeProjects = stats.engagements.filter(e => e.assignedStaff?.some(s => s === user._id || s._id === user._id));

    // Prepare chart data (hours logged daily for the last 6 logs)
    const dailyData = myTS.slice(0, 6).reverse().map(ts => ({
      name: ts.date.substring(5), // MM-DD
      hours: ts.hours,
      status: ts.status
    }));

    return (
      <div>
        {/* KPI Cards */}
        <div className="dashboard-grid">
          <div className="glass-panel stat-card">
            <div className="stat-content">
              <span className="stat-title">Total Hours Logged</span>
              <span className="stat-value">{totalHours} hrs</span>
              <span className="stat-desc">Approved: {approvedHours} | Draft: {draftHours}</span>
            </div>
            <div className="stat-icon primary">
              <Clock size={24} />
            </div>
          </div>
          <div className="glass-panel stat-card">
            <div className="stat-content">
              <span className="stat-title">My Projects</span>
              <span className="stat-value">{activeProjects.length}</span>
              <span className="stat-desc">Active assigned engagements</span>
            </div>
            <div className="stat-icon success">
              <Briefcase size={24} />
            </div>
          </div>
          <div className="glass-panel stat-card">
            <div className="stat-content">
              <span className="stat-title">Corporate Assets Issued</span>
              <span className="stat-value">{myAssets.length}</span>
              <span className="stat-desc">Checked out under possession</span>
            </div>
            <div className="stat-icon warning">
              <Monitor size={24} />
            </div>
          </div>
        </div>

        <div className="dashboard-sections">
          {/* Chart */}
          <div className="glass-panel section-card">
            <div className="section-header">
              <h3>
                <Clock size={18} style={{ marginRight: '8px' }} />
                Daily Hours Logging Activity
              </h3>
            </div>
            <div style={{ width: '100%', height: 300 }}>
              {dailyData.length === 0 ? (
                <p className="stat-desc" style={{ textAlign: 'center', paddingTop: '100px' }}>No timesheet logs available for chart representation.</p>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={dailyData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorHours" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(220, 95%, 60%)" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="hsl(220, 95%, 60%)" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" />
                    <XAxis dataKey="name" stroke="var(--text-secondary)" fontSize={12} />
                    <YAxis stroke="var(--text-secondary)" fontSize={12} />
                    <Tooltip contentStyle={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }} />
                    <Area type="monotone" dataKey="hours" stroke="var(--accent-primary)" fillOpacity={1} fill="url(#colorHours)" />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Asset checklist info panel */}
          <div className="glass-panel section-card">
            <div className="section-header">
              <h3>Recent Project Assignments</h3>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {activeProjects.length === 0 ? (
                <p className="stat-desc">You are not currently assigned to any engagements.</p>
              ) : (
                activeProjects.map(proj => (
                  <div key={proj._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
                    <div>
                      <h4 style={{ fontSize: '0.95rem', fontWeight: 600 }}>{proj.name}</h4>
                      <span className="stat-desc">Due: {new Date(proj.dueDate).toLocaleDateString()}</span>
                    </div>
                    <span className="badge badge-submitted">{proj.status.replace(/_/g, ' ')}</span>
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
  // MANAGER USER DASHBOARD
  // ==========================================
  if (user.role === 'manager') {
    const pendingTS = stats.timesheets.filter(t => t.status === 'submitted');
    const activeEngage = stats.engagements.filter(e => e.status === 'work_in_progress' || e.status === 'review_pending');
    
    // Group active timesheet hours by staff member for visualization
    const staffHours = {};
    stats.timesheets.forEach(ts => {
      if (ts.status === 'approved') {
        const name = ts.employeeId?.name || 'Unknown';
        staffHours[name] = (staffHours[name] || 0) + ts.hours;
      }
    });

    const chartData = Object.keys(staffHours).map(name => ({
      name,
      hours: staffHours[name]
    })).slice(0, 5);

    return (
      <div>
        <div className="dashboard-grid">
          <div className="glass-panel stat-card">
            <div className="stat-content">
              <span className="stat-title">Pending Timesheet Reviews</span>
              <span className="stat-value" style={{ color: pendingTS.length > 0 ? 'var(--warning)' : 'white' }}>
                {pendingTS.length}
              </span>
              <span className="stat-desc">Awaiting manager sign-offs</span>
            </div>
            <div className="stat-icon warning">
              <Clock size={24} />
            </div>
          </div>
          <div className="glass-panel stat-card">
            <div className="stat-content">
              <span className="stat-title">Active Projects Scope</span>
              <span className="stat-value">{activeEngage.length}</span>
              <span className="stat-desc">Ongoing client assignments</span>
            </div>
            <div className="stat-icon primary">
              <Briefcase size={24} />
            </div>
          </div>
          <div className="glass-panel stat-card">
            <div className="stat-content">
              <span className="stat-title">Subordinates Active</span>
              <span className="stat-value">{stats.employees.length}</span>
              <span className="stat-desc">Total reporting staff members</span>
            </div>
            <div className="stat-icon success">
              <Users size={24} />
            </div>
          </div>
        </div>

        <div className="dashboard-sections">
          <div className="glass-panel section-card">
            <div className="section-header">
              <h3>
                <Users size={18} style={{ marginRight: '8px' }} />
                Subordinate Resource Logging (Approved Hours)
              </h3>
            </div>
            <div style={{ width: '100%', height: 300 }}>
              {chartData.length === 0 ? (
                <p className="stat-desc" style={{ textAlign: 'center', paddingTop: '100px' }}>No subordinate logging details available yet.</p>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" />
                    <XAxis dataKey="name" stroke="var(--text-secondary)" fontSize={12} />
                    <YAxis stroke="var(--text-secondary)" fontSize={12} />
                    <Tooltip contentStyle={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-color)' }} />
                    <Bar dataKey="hours" fill="hsl(220, 95%, 60%)" radius={[4, 4, 0, 0]}>
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={`hsl(220, 95%, ${60 - index * 4}%)`} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          <div className="glass-panel section-card">
            <div className="section-header">
              <h3>Subordinate Pending Review List</h3>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {pendingTS.length === 0 ? (
                <p className="stat-desc">No timesheets currently awaiting review. Great work!</p>
              ) : (
                pendingTS.slice(0, 4).map(ts => (
                  <div key={ts._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
                    <div>
                      <h4 style={{ fontSize: '0.9rem', fontWeight: 600 }}>{ts.employeeId?.name}</h4>
                      <p className="stat-desc">{ts.engagementId?.name} ({ts.hours} hrs)</p>
                    </div>
                    <span className="badge badge-submitted">{ts.date}</span>
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
  // ADMIN USER DASHBOARD
  // ==========================================
  // In MERN, calculate billing summaries dynamically
  // billing details: sum of approved hours * $150 per client
  const clientBilling = {};
  stats.timesheets.forEach(ts => {
    if (ts.status === 'approved' && ts.engagementId?.billable) {
      const clientName = ts.engagementId?.clientId?.name || ts.engagementId?.name || 'Internal';
      clientBilling[clientName] = (clientBilling[clientName] || 0) + (ts.hours * 150);
    }
  });

  const billingChartData = Object.keys(clientBilling).map(name => ({
    name,
    amount: clientBilling[name]
  }));

  const COLORS = ['hsl(220, 95%, 60%)', 'hsl(260, 90%, 55%)', 'hsl(142, 72%, 45%)', 'hsl(38, 92%, 50%)'];

  return (
    <div>
      {/* KPI Cards */}
      <div className="dashboard-grid">
        <div className="glass-panel stat-card">
          <div className="stat-content">
            <span className="stat-title">System Client Portfolios</span>
            <span className="stat-value">{stats.clients.length}</span>
            <span className="stat-desc">External organizations</span>
          </div>
          <div className="stat-icon primary">
            <Briefcase size={24} />
          </div>
        </div>
        <div className="glass-panel stat-card">
          <div className="stat-content">
            <span className="stat-title">Total Active Staff</span>
            <span className="stat-value">{stats.employees.length}</span>
            <span className="stat-desc">Workspace users registered</span>
          </div>
          <div className="stat-icon success">
            <Users size={24} />
          </div>
        </div>
        <div className="glass-panel stat-card">
          <div className="stat-content">
            <span className="stat-title">IT Overdue Assets</span>
            <span className="stat-value" style={{ color: stats.assetDashboard?.overdue.length > 0 ? 'var(--danger)' : 'white' }}>
              {stats.assetDashboard?.overdue.length}
            </span>
            <span className="stat-desc">Devices past expected return</span>
          </div>
          <div className="stat-icon danger">
            <ShieldAlert size={24} />
          </div>
        </div>
        <div className="glass-panel stat-card">
          <div className="stat-content">
            <span className="stat-title">Total Inventory Stock</span>
            <span className="stat-value">{stats.assetDashboard?.summary.total}</span>
            <span className="stat-desc">Devices in physical system</span>
          </div>
          <div className="stat-icon primary">
            <Monitor size={24} />
          </div>
        </div>
      </div>

      <div className="dashboard-sections">
        {/* Billing reports dynamic chart */}
        <div className="glass-panel section-card">
          <div className="section-header">
            <h3>
              <DollarSign size={18} style={{ marginRight: '8px' }} />
              Firm Billing Summary (Client Account Revenues)
            </h3>
          </div>
          <div style={{ width: '100%', height: 300 }}>
            {billingChartData.length === 0 ? (
              <p className="stat-desc" style={{ textAlign: 'center', paddingTop: '100px' }}>No billable approved timesheets found to compute revenues.</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={billingChartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" />
                  <XAxis dataKey="name" stroke="var(--text-secondary)" fontSize={11} />
                  <YAxis stroke="var(--text-secondary)" fontSize={12} unit="$" />
                  <Tooltip formatter={(value) => [`$${value}`, 'Revenue']} contentStyle={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-color)' }} />
                  <Bar dataKey="amount" fill="hsl(142, 72%, 45%)" radius={[4, 4, 0, 0]}>
                    {billingChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Company Billing details list */}
        <div className="glass-panel section-card">
          <div className="section-header">
            <h3>Account Balances</h3>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {billingChartData.length === 0 ? (
              <p className="stat-desc">No billing accounts calculated. Log approved hours.</p>
            ) : (
              billingChartData.map((bill, index) => (
                <div key={index} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
                  <div>
                    <h4 style={{ fontSize: '0.95rem', fontWeight: 600 }}>{bill.name}</h4>
                    <span className="stat-desc">Hourly Rate: $150 / hr</span>
                  </div>
                  <strong style={{ color: 'var(--success)', fontSize: '1.1rem' }}>${bill.amount.toLocaleString()}</strong>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
