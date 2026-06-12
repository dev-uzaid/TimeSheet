import React, { useState, useEffect } from 'react';
import { api } from '../../utils/api';
import { Briefcase, Clock, Activity, AlertCircle } from 'lucide-react';

export default function WorkInProgress() {
  const [engagements, setEngagements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchEngs = async () => {
      try {
        setLoading(true);
        const data = await api.get('/engagements');
        // Filter out completed and billed
        const active = data.filter(e => ['unassigned', 'work_in_progress', 'review_pending'].includes(e.status));
        setEngagements(active);
      } catch (err) {
        console.error(err);
        setError('Failed to fetch in-progress engagements.');
      } finally {
        setLoading(false);
      }
    };
    fetchEngs();
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div className="glass-panel section-card" style={{ marginBottom: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Activity size={24} style={{ color: 'var(--accent-primary)' }} />
          <h2 style={{ fontSize: '1.25rem', margin: 0 }}>Work in Progress (Ongoing Engagements)</h2>
        </div>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '6px', marginBottom: 0 }}>
          Monitor all active projects and engagements currently in execution or awaiting staff assignment.
        </p>
      </div>

      <div className="glass-panel section-card">
        <div className="section-header">
          <h3>Active Portfolios ({engagements.length})</h3>
        </div>

        {loading ? (
          <p style={{ textAlign: 'center', padding: '32px', color: 'var(--text-secondary)' }}>Loading active engagements...</p>
        ) : error ? (
          <p style={{ textAlign: 'center', padding: '32px', color: 'var(--danger)', fontWeight: 600 }}>{error}</p>
        ) : engagements.length === 0 ? (
          <p style={{ textAlign: 'center', padding: '32px', color: 'var(--text-secondary)' }}>No engagements are currently in progress.</p>
        ) : (
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Client Company</th>
                  <th>Project Scope</th>
                  <th>Work Type</th>
                  <th>Target Delivery</th>
                  <th>Billable</th>
                  <th>Assigned Staff</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {engagements.map(e => (
                  <tr key={e._id}>
                    <td style={{ fontWeight: 600 }}>{e.clientId?.name || 'External Client'}</td>
                    <td>{e.name}</td>
                    <td>
                      <span className="badge badge-submitted" style={{ textTransform: 'none' }}>
                        {e.workType}
                      </span>
                    </td>
                    <td>{e.dueDate ? new Date(e.dueDate).toLocaleDateString() : '—'}</td>
                    <td>
                      <span className={`badge ${e.billable ? 'badge-success' : 'badge-draft'}`}>
                        {e.billable ? 'Billable' : 'Non-Billable'}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        {!e.assignedStaff || e.assignedStaff.length === 0 ? (
                          <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Unassigned</span>
                        ) : (
                          e.assignedStaff.map(s => (
                            <span key={s._id} style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>• {s.name}</span>
                          ))
                        )}
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${
                        e.status === 'review_pending' ? 'badge-warning' :
                        e.status === 'work_in_progress' ? 'badge-submitted' : 'badge-draft'
                      }`}>
                        {e.status.replace(/_/g, ' ')}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
