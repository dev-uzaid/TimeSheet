import React from 'react';
import { Monitor, ShieldCheck, Send, AlertOctagon, Cpu, Trash2, CheckCircle, History } from 'lucide-react';

export default function AssetDashboard({ dashboardData, setActiveTab, user }) {
  if (!dashboardData) return null;

  return (
    <div className="tab-pane-content">
      {/* Dashboard Summary Cards */}
      <div className="dashboard-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div className="glass-panel stat-card" style={{ padding: '20px' }}>
          <div className="stat-content">
            <span className="stat-title">Total Registered Assets</span>
            <span className="stat-value">{dashboardData.summary.total}</span>
          </div>
          <div className="stat-icon primary"><Monitor size={20} /></div>
        </div>
        
        <div className="glass-panel stat-card" style={{ padding: '20px' }}>
          <div className="stat-content">
            <span className="stat-title">Available in Office</span>
            <span className="stat-value" style={{ color: 'var(--success)' }}>{dashboardData.summary.inOffice}</span>
          </div>
          <div className="stat-icon success"><ShieldCheck size={20} /></div>
        </div>

        <div className="glass-panel stat-card" style={{ padding: '20px' }}>
          <div className="stat-content">
            <span className="stat-title">Deployed at Client</span>
            <span className="stat-value">{dashboardData.summary.deployed}</span>
          </div>
          <div className="stat-icon primary"><Send size={20} /></div>
        </div>

        <div className="glass-panel stat-card" style={{ padding: '20px' }}>
          <div className="stat-content">
            <span className="stat-title">Under Maintenance</span>
            <span className="stat-value" style={{ color: 'var(--warning)' }}>{dashboardData.summary.maintenance}</span>
          </div>
          <div className="stat-icon warning"><Cpu size={20} /></div>
        </div>

        <div className="glass-panel stat-card" style={{ padding: '20px' }}>
          <div className="stat-content">
            <span className="stat-title">Overdue Returns</span>
            <span className="stat-value" style={{ color: dashboardData.summary.overdue > 0 ? 'var(--danger)' : 'var(--text-primary)' }}>
              {dashboardData.summary.overdue}
            </span>
          </div>
          <div className="stat-icon danger"><AlertOctagon size={20} /></div>
        </div>

        <div className="glass-panel stat-card" style={{ padding: '20px' }}>
          <div className="stat-content">
            <span className="stat-title">Retired Assets</span>
            <span className="stat-value" style={{ color: 'var(--text-muted)' }}>{dashboardData.summary.retired}</span>
          </div>
          <div className="stat-icon"><Trash2 size={20} /></div>
        </div>
      </div>

      {/* Overdue alert banner if counts > 0 */}
      {dashboardData.summary.overdue > 0 && (
        <div className="alert-card animate-pulse" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--danger-glow)', border: '1px solid rgba(239, 68, 68, 0.2)', padding: '16px 20px', borderRadius: '10px', color: 'var(--danger)', marginBottom: '24px' }}>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <AlertOctagon size={22} />
            <span style={{ fontWeight: 600 }}>WARNING: There are {dashboardData.summary.overdue} IT equipment assignments currently overdue!</span>
          </div>
          <button onClick={() => setActiveTab('reports')} className="btn btn-danger btn-sm" style={{ padding: '6px 12px', fontSize: '0.8rem' }}>
            View Delinquency List
          </button>
        </div>
      )}

      {/* Graphs / Analytics Row */}
      <div className="dashboard-sections" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
        {/* Status distribution Pie/Donut Visual */}
        <div className="glass-panel section-card" style={{ minHeight: '320px', display: 'flex', flexDirection: 'column' }}>
          <div className="section-header">
            <h3>Asset Status Distribution</h3>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-around', flexGrow: 1, padding: '10px' }}>
            {/* SVG Donut */}
            <div style={{ width: '150px', height: '150px', position: 'relative' }}>
              <svg viewBox="0 0 42 42" className="donut" style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
                <circle cx="21" cy="21" r="15.915" fill="transparent" stroke="var(--bg-tertiary)" strokeWidth="4" />
                {(() => {
                  let cumPercent = 0;
                  const colors = ['var(--success)', 'var(--accent-primary)', 'var(--warning)', 'var(--danger)', 'var(--text-muted)'];
                  return dashboardData.charts.statusDistribution.map((slice, idx) => {
                    const total = dashboardData.summary.total || 1;
                    const percent = (slice.value / total) * 100;
                    if (percent === 0) return null;
                    const dashArray = `${percent} ${100 - percent}`;
                    const dashOffset = 100 - cumPercent;
                    cumPercent += percent;
                    return (
                      <circle
                        key={slice.name}
                        cx="21"
                        cy="21"
                        r="15.915"
                        fill="transparent"
                        stroke={colors[idx % colors.length]}
                        strokeWidth="4"
                        strokeDasharray={dashArray}
                        strokeDashoffset={dashOffset}
                        style={{ transition: 'stroke-dasharray 0.6s ease' }}
                      />
                    );
                  });
                })()}
              </svg>
              <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center' }}>
                <div style={{ fontSize: '1.8rem', fontWeight: 800, fontFamily: 'Outfit' }}>{dashboardData.summary.total}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Devices</div>
              </div>
            </div>

            {/* Legend */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {dashboardData.charts.statusDistribution.map((slice, idx) => {
                const colors = ['var(--success)', 'var(--accent-primary)', 'var(--warning)', 'var(--danger)', 'var(--text-muted)'];
                const total = dashboardData.summary.total || 1;
                const percent = Math.round((slice.value / total) * 100);
                return (
                  <div key={slice.name} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.85rem' }}>
                    <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: colors[idx % colors.length] }} />
                    <span style={{ color: 'var(--text-secondary)', minWidth: '130px' }}>{slice.name}</span>
                    <strong style={{ color: 'var(--text-primary)' }}>{slice.value} ({percent}%)</strong>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Monthly movements (Area Chart) */}
        <div className="glass-panel section-card" style={{ minHeight: '320px', display: 'flex', flexDirection: 'column' }}>
          <div className="section-header">
            <h3>Movement Activity Timeline (Last 6 Months)</h3>
          </div>
          <div style={{ flexGrow: 1, padding: '10px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            {(() => {
              const movements = dashboardData.charts.monthlyMovements || [];
              if (movements.length === 0) return <p style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No historical data</p>;
              const maxVal = Math.max(...movements.map(m => Math.max(m.checkouts, m.returns)), 4);
              
              const width = 400;
              const height = 140;
              const getX = (idx) => (idx * (width / 5));
              const getY = (val) => height - (val * (height - 30) / maxVal) - 15;

              const checkoutPoints = movements.map((m, i) => `${getX(i)},${getY(m.checkouts)}`).join(' ');
              const returnPoints = movements.map((m, i) => `${getX(i)},${getY(m.returns)}`).join(' ');

              return (
                <div>
                  <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', height: '180px', overflow: 'visible' }}>
                    {/* Grids */}
                    {[0, 0.25, 0.5, 0.75, 1].map((r, idx) => {
                      const y = height - (r * (height - 30)) - 15;
                      return (
                        <line key={idx} x1="0" y1={y} x2={width} y2={y} stroke="var(--border-color)" strokeWidth="1" strokeDasharray="4 4" />
                      );
                    })}

                    {/* Checkout Line */}
                    <polyline points={checkoutPoints} fill="none" stroke="var(--accent-primary)" strokeWidth="3.5" strokeLinecap="round" />
                    {movements.map((m, i) => (
                      <circle key={`co-${i}`} cx={getX(i)} cy={getY(m.checkouts)} r="5" fill="var(--bg-primary)" stroke="var(--accent-primary)" strokeWidth="2.5" />
                    ))}

                    {/* Return Line */}
                    <polyline points={returnPoints} fill="none" stroke="var(--success)" strokeWidth="3.5" strokeLinecap="round" />
                    {movements.map((m, i) => (
                      <circle key={`ret-${i}`} cx={getX(i)} cy={getY(m.returns)} r="5" fill="var(--bg-primary)" stroke="var(--success)" strokeWidth="2.5" />
                    ))}
                  </svg>

                  {/* X labels & Legend */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    {movements.map(m => <span key={m.month}>{m.month}</span>)}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginTop: '8px', fontSize: '0.85rem' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ width: '12px', height: '3px', background: 'var(--accent-primary)', display: 'inline-block' }} />
                      Checkouts Issued
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ width: '12px', height: '3px', background: 'var(--success)', display: 'inline-block' }} />
                      Returns Received
                    </span>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      </div>

      <div className="dashboard-sections" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        {/* Device Type Breakdown */}
        <div className="glass-panel section-card">
          <div className="section-header">
            <h3>Hardware Device Types Allocation</h3>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '10px 0' }}>
            {dashboardData.charts.deviceTypeDistribution.length === 0 ? (
              <p style={{ color: 'var(--text-muted)' }}>No catalog categories</p>
            ) : (
              dashboardData.charts.deviceTypeDistribution.map((item) => {
                const total = dashboardData.summary.total || 1;
                const percent = Math.round((item.value / total) * 100);
                return (
                  <div key={item.name}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', marginBottom: '6px' }}>
                      <span style={{ fontWeight: 600 }}>{item.name}</span>
                      <span style={{ color: 'var(--text-secondary)' }}>{item.value} units ({percent}%)</span>
                    </div>
                    <div style={{ background: 'var(--bg-tertiary)', height: '10px', borderRadius: '5px', overflow: 'hidden', display: 'flex' }}>
                      <div style={{ background: 'var(--accent-gradient)', width: `${percent}%`, borderRadius: '5px', boxShadow: '0 0 8px var(--accent-glow)' }} />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Recent Custody Movements */}
        <div className="glass-panel section-card">
          <div className="section-header">
            <h3>Recent Checkout Activity Feed</h3>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '320px', overflowY: 'auto', paddingRight: '4px' }}>
            {dashboardData.recentActivity.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '24px' }}>No operations logged</p>
            ) : (
              dashboardData.recentActivity.map((log) => {
                const isReturn = log.actualReturnDate !== null;
                return (
                  <div key={log._id} className="activity-item" style={{ padding: '10px 14px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span style={{ 
                        padding: '8px', 
                        borderRadius: '6px', 
                        background: isReturn ? 'var(--success-glow)' : 'var(--accent-glow)', 
                        color: isReturn ? 'var(--success)' : 'var(--accent-primary)' 
                      }}>
                        {isReturn ? <CheckCircle size={16} /> : <Send size={16} />}
                      </span>
                      <div>
                        <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>
                          {isReturn ? 'Returned:' : 'Issued:'} {log.assetId?.assetTag}
                        </div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                          Assigned to {log.employeeId?.name || 'Staff'}
                        </div>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span className={`badge ${isReturn ? 'badge-success' : 'badge-submitted'}`} style={{ fontSize: '0.7rem' }}>
                        {isReturn ? 'Checked-in' : 'Deployed'}
                      </span>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                        {new Date(isReturn ? log.actualReturnDate : log.checkoutDate).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
