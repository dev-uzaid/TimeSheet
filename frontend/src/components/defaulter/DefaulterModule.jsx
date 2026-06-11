import React, { useState } from 'react';
import { ShieldAlert, RefreshCw, Calendar, AlertTriangle, Trash2, Search } from 'lucide-react';
import { 
  useGetDefaultersQuery, 
  useRunAuditMutation, 
  useDeleteDefaulterMutation 
} from '../../redux/services/defaulterApi';
import { toast } from 'react-toastify';

export default function DefaulterModule() {
  // Query Filters state
  const [search, setSearch] = useState('');
  const [defaulterType, setDefaulterType] = useState('');
  const [weekStartDate, setWeekStartDate] = useState('');

  // Engine trigger date (state for manually running audit)
  const [auditDate, setAuditDate] = useState('');

  // RTK Query endpoints
  const { data: defaulters = [], isLoading, isError, refetch } = useGetDefaultersQuery({
    search: search || undefined,
    defaulterType: defaulterType || undefined,
    weekStartDate: weekStartDate || undefined
  });

  const [runAudit, { isLoading: running }] = useRunAuditMutation();
  const [deleteDefaulter] = useDeleteDefaulterMutation();

  const handleRunEngine = async (e) => {
    e.preventDefault();
    try {
      const payload = auditDate ? { weekStartDate: auditDate } : {};
      const res = await runAudit(payload).unwrap();
      toast.success(res.message || `Audit check successful! Flagged ${res.defaultersLogged} defaulters.`);
      setAuditDate('');
    } catch (err) {
      toast.error(err?.data?.message || err?.message || 'Failed to run defaulter audit.');
    }
  };

  const handleClearDefaulter = async (id) => {
    if (window.confirm("Are you sure you want to clear this compliance flag?")) {
      try {
        await deleteDefaulter(id).unwrap();
        toast.success("Defaulter record cleared successfully");
      } catch (err) {
        toast.error(err?.data?.message || err?.message || "Failed to clear flag");
      }
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Control Panel */}
      <div className="glass-panel section-card">
        <div className="section-header">
          <h3>
            <ShieldAlert size={20} style={{ color: 'var(--accent-primary)' }} />
            Defaulter Audit Control Engine
          </h3>
        </div>
        
        <form onSubmit={handleRunEngine} style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'flex-end' }}>
          <div className="form-group" style={{ flexGrow: 1, minWidth: '240px', marginBottom: 0 }}>
            <label>Run Manual Audit (Select week Monday date)</label>
            <div style={{ position: 'relative' }}>
              <input 
                type="date" 
                className="form-control" 
                value={auditDate}
                onChange={(e) => setAuditDate(e.target.value)}
                style={{ width: '100%', paddingLeft: '40px' }}
              />
              <Calendar size={18} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-muted)' }} />
            </div>
          </div>
          <button type="submit" disabled={running} className="btn btn-primary" style={{ height: '46px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            {running ? <RefreshCw className="animate-spin" size={18} /> : <ShieldAlert size={18} />}
            {running ? 'Running Compliance Check...' : 'Run Audit Check'}
          </button>
        </form>
      </div>

      {/* Filter and Search Bar */}
      <div className="glass-panel section-card" style={{ padding: '20px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'center' }}>
          {/* Search box */}
          <div style={{ flex: 1, minWidth: '250px', position: 'relative' }}>
            <input 
              type="text" 
              className="form-control"
              placeholder="Search by Employee, Email, Department, Manager..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ width: '100%', paddingLeft: '40px' }}
            />
            <Search size={18} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-muted)' }} />
          </div>

          {/* Type Filter */}
          <div style={{ minWidth: '180px' }}>
            <select
              className="form-control"
              value={defaulterType}
              onChange={(e) => setDefaulterType(e.target.value)}
              style={{ width: '100%' }}
            >
              <option value="">All Defaulter Types</option>
              <option value="Zero Entries">Zero Entries</option>
              <option value="Partial Entries">Partial Entries</option>
            </select>
          </div>

          {/* Week Filter */}
          <div style={{ minWidth: '180px', position: 'relative' }}>
            <input
              type="date"
              className="form-control"
              placeholder="Audit Monday Date"
              value={weekStartDate}
              onChange={(e) => setWeekStartDate(e.target.value)}
              style={{ width: '100%', paddingLeft: '40px' }}
              title="Filter by Audit Monday"
            />
            <Calendar size={18} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-muted)' }} />
          </div>

          {/* Reset Filters button */}
          {(search || defaulterType || weekStartDate) && (
            <button 
              className="btn btn-secondary" 
              onClick={() => {
                setSearch('');
                setDefaulterType('');
                setWeekStartDate('');
              }}
              style={{ height: '42px', padding: '0 16px' }}
            >
              Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* Audit Logs list */}
      <div className="glass-panel section-card">
        <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3>
            <ShieldAlert size={20} style={{ color: 'var(--accent-primary)' }} />
            Weekly Defaulter Logs ({defaulters.length})
          </h3>
          <button onClick={refetch} className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <RefreshCw size={14} /> Refresh Logs
          </button>
        </div>

        {isLoading ? (
          <p className="stat-desc" style={{ textAlign: 'center', padding: '48px', color: 'var(--text-secondary)' }}>
            Loading compliance checks...
          </p>
        ) : isError ? (
          <p className="stat-desc" style={{ textAlign: 'center', padding: '48px', color: 'var(--danger)', fontWeight: 600 }}>
            Error fetching compliance logs. Please confirm credentials.
          </p>
        ) : defaulters.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '64px 24px', color: 'var(--text-secondary)' }}>
            <ShieldAlert size={56} style={{ opacity: 0.3, marginBottom: '16px', color: 'var(--success)' }} />
            <h4 style={{ color: 'var(--text-primary)', marginBottom: '8px' }}>Compliant Workspace</h4>
            <p className="stat-desc" style={{ maxWidth: '400px', margin: '0 auto' }}>
              All employees have successfully completed their timesheet submissions for the selected audit parameters.
            </p>
          </div>
        ) : (
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', 
            gap: '20px', 
            padding: '4px' 
          }}>
            {defaulters.map((record) => (
              <div 
                key={record._id} 
                className="glass-panel" 
                style={{ 
                  padding: '20px', 
                  borderRadius: '12px',
                  border: '1px solid var(--border-color)',
                  position: 'relative',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px'
                }}
              >
                {/* Clear action */}
                <button
                  onClick={() => handleClearDefaulter(record._id)}
                  style={{
                    position: 'absolute',
                    top: '16px',
                    right: '16px',
                    background: 'rgba(239, 68, 68, 0.08)',
                    border: 'none',
                    borderRadius: '8px',
                    width: '32px',
                    height: '32px',
                    color: 'var(--danger)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'var(--danger)';
                    e.currentTarget.style.color = '#ffffff';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(239, 68, 68, 0.08)';
                    e.currentTarget.style.color = 'var(--danger)';
                  }}
                  title="Clear Defaulter Record"
                >
                  <Trash2 size={16} />
                </button>

                {/* Headings */}
                <div style={{ paddingRight: '36px' }}>
                  <h4 style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                    {record.employeeName || 'Staff Member'}
                  </h4>
                  <p className="stat-desc" style={{ marginTop: '2px' }}>{record.email}</p>
                </div>

                {/* Class badge */}
                <div>
                  <span className={`badge ${record.defaulterType === 'Zero Entries' ? 'badge-rejected' : 'badge-warning'}`}>
                    {record.defaulterType}
                  </span>
                </div>

                {/* Scope details */}
                <div style={{ 
                  marginTop: '4px', 
                  borderTop: '1px solid var(--border-color)', 
                  paddingTop: '12px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px',
                  fontSize: '0.85rem'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Department:</span>
                    <strong style={{ color: 'var(--text-primary)' }}>{record.department}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Manager:</span>
                    <strong style={{ color: 'var(--text-primary)' }}>{record.manager}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Audit Week Monday:</span>
                    <strong style={{ color: 'var(--text-primary)' }}>{record.weekStartDate}</strong>
                  </div>
                </div>

                {/* Missing days list */}
                <div style={{ marginTop: '4px' }}>
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <AlertTriangle size={14} style={{ color: 'var(--danger)' }} />
                    <strong>Missing Logging Dates:</strong>
                  </p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {record.missingDates.map((date, idx) => (
                      <span 
                        key={idx} 
                        style={{
                          fontSize: '0.75rem',
                          background: 'rgba(239, 68, 68, 0.1)',
                          color: 'var(--danger)',
                          border: '1px solid rgba(239, 68, 68, 0.2)',
                          padding: '3px 8px',
                          borderRadius: '12px',
                          fontWeight: 500
                        }}
                      >
                        {date}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
