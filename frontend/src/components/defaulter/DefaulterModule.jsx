import React, { useState, useEffect } from 'react';
import { ShieldAlert, RefreshCw, Calendar, AlertTriangle } from 'lucide-react';
import { api } from '../../utils/api';

export default function DefaulterModule() {
  const [defaulters, setDefaulters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [runDate, setRunDate] = useState('');
  const [running, setRunning] = useState(false);
  const [message, setMessage] = useState('');

  const fetchDefaulters = async () => {
    try {
      setLoading(true);
      const data = await api.get('/defaulters');
      setDefaulters(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDefaulters();
  }, []);

  const handleRunEngine = async (e) => {
    e.preventDefault();
    try {
      setRunning(true);
      setMessage('');
      const payload = runDate ? { weekStartDate: runDate } : {};
      const res = await api.post('/defaulters/run', payload);
      setMessage(`Success: Scanned ${res.scannedEmployees} staff, found ${res.defaultersLogged} defaulters.`);
      fetchDefaulters();
    } catch (err) {
      setMessage(`Error: ${err.message}`);
    } finally {
      setRunning(false);
    }
  };

  return (
    <div>
      {/* Admin Action Control */}
      <div className="glass-panel section-card" style={{ marginBottom: '24px' }}>
        <div className="section-header">
          <h3>
            <ShieldAlert size={20} />
            Defaulter Audit Control Engine
          </h3>
        </div>
        <form onSubmit={handleRunEngine} style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'flex-end' }}>
          <div className="form-group" style={{ flexGrow: 1, minWidth: '240px', marginBottom: 0 }}>
            <label>Choose Monday of the Audit Week (Optional)</label>
            <div style={{ position: 'relative' }}>
              <input 
                type="date" 
                className="form-control" 
                value={runDate}
                onChange={(e) => setRunDate(e.target.value)}
                style={{ width: '100%', paddingLeft: '40px' }}
              />
              <Calendar size={18} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-muted)' }} />
            </div>
          </div>
          <button type="submit" disabled={running} className="btn btn-primary" style={{ height: '46px' }}>
            {running ? <RefreshCw className="animate-spin" size={18} /> : <ShieldAlert size={18} />}
            {running ? 'Scanning Database...' : 'Run Weekly Audit Check'}
          </button>
        </form>
        {message && (
          <p className="stat-desc" style={{ marginTop: '16px', color: message.startsWith('Error') ? 'var(--danger)' : 'var(--success)', fontWeight: 600 }}>
            {message}
          </p>
        )}
      </div>

      {/* Defaulter Audit Results */}
      <div className="glass-panel section-card">
        <div className="section-header">
          <h3>
            <ShieldAlert size={20} />
            Weekly Defaulters Log ({defaulters.length})
          </h3>
        </div>

        {loading ? (
          <p className="stat-desc" style={{ textAlign: 'center', padding: '32px' }}>Loading audit records...</p>
        ) : defaulters.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 24px', color: 'var(--text-secondary)' }}>
            <ShieldAlert size={48} style={{ opacity: 0.3, marginBottom: '16px', color: 'var(--success)' }} />
            <p>Excellent compliance! No employees flagged as defaulters.</p>
          </div>
        ) : (
          <div className="defaulter-list">
            {defaulters.map((record) => (
              <div key={record._id} className="glass-panel defaulter-card">
                <div className="defaulter-header">
                  <div>
                    <h4 className="defaulter-name">{record.employeeId?.name || 'Unknown Staff'}</h4>
                    <p className="stat-desc">Email: {record.employeeId?.email}</p>
                  </div>
                  <span className={`badge ${record.type === 'zero' ? 'badge-rejected' : 'badge-warning'}`}>
                    {record.type === 'zero' ? 'Zero Entries' : 'Partial Entries'}
                  </span>
                </div>
                
                <div className="defaulter-details" style={{ marginTop: '12px', borderTop: '1px solid var(--border-color)', paddingTop: '12px' }}>
                  <p style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span>Audit Week Monday:</span>
                    <strong style={{ color: 'var(--text-primary)' }}>{record.weekStartDate}</strong>
                  </p>
                  <p style={{ marginBottom: '8px' }}>
                    <AlertTriangle size={14} style={{ color: 'var(--danger)', marginRight: '6px', verticalAlign: 'middle' }} />
                    <span style={{ fontWeight: 500 }}>Flagged Incomplete Workdays:</span>
                  </p>
                  <div className="defaulter-days-grid">
                    {record.missingDays.map((day, idx) => (
                      <span key={idx} className="defaulter-day-pill">{day}</span>
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
