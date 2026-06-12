import React, { useState, useEffect } from 'react';
import { api } from '../../utils/api';
import { Building, Clock, ChevronDown, ChevronUp } from 'lucide-react';

export default function ClientTimeSummary() {
  const [clients, setClients] = useState([]);
  const [timesheets, setTimesheets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedClients, setExpandedClients] = useState({});

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [clientsData, timesheetsData] = await Promise.all([
          api.get('/clients'),
          api.get('/timesheets')
        ]);
        setClients(clientsData);
        setTimesheets(timesheetsData);
      } catch (err) {
        console.error(err);
        setError('Failed to fetch client time summary report.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const toggleExpand = (clientId) => {
    setExpandedClients(prev => ({
      ...prev,
      [clientId]: !prev[clientId]
    }));
  };

  const getClientHours = (client) => {
    const engIds = client.engagements?.map(e => (typeof e === 'object' ? e._id : e)) || [];
    const clientTS = timesheets.filter(t => {
      const engId = typeof t.engagementId === 'object' ? t.engagementId?._id : t.engagementId;
      return engIds.includes(engId);
    });
    const totalHours = clientTS.reduce((sum, t) => sum + t.hours, 0);
    return {
      totalHours,
      timesheets: clientTS
    };
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div className="glass-panel section-card" style={{ marginBottom: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Building size={24} style={{ color: 'var(--accent-primary)' }} />
          <h2 style={{ fontSize: '1.25rem', margin: 0 }}>Client Time Summary</h2>
        </div>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '6px', marginBottom: 0 }}>
          View total accumulated timesheet hours logged per corporate client, with detailed breakdowns by engagement project.
        </p>
      </div>

      <div className="glass-panel section-card">
        <div className="section-header">
          <h3>Clients Accumulated Time Ledger ({clients.length})</h3>
        </div>

        {loading ? (
          <p style={{ textAlign: 'center', padding: '32px', color: 'var(--text-secondary)' }}>Loading client time summaries...</p>
        ) : error ? (
          <p style={{ textAlign: 'center', padding: '32px', color: 'var(--danger)', fontWeight: 600 }}>{error}</p>
        ) : clients.length === 0 ? (
          <p style={{ textAlign: 'center', padding: '32px', color: 'var(--text-secondary)' }}>No registered clients available.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {clients.map(client => {
              const { totalHours, timesheets: clientTS } = getClientHours(client);
              const isExpanded = !!expandedClients[client._id];

              const engagementBreakdown = {};
              clientTS.forEach(t => {
                const engName = t.engagementId?.name || 'Unknown Engagement';
                if (!engagementBreakdown[engName]) {
                  engagementBreakdown[engName] = {
                    hours: 0,
                    workType: t.workType,
                    status: t.engagementId?.status || 'unassigned'
                  };
                }
                engagementBreakdown[engName].hours += t.hours;
              });

              return (
                <div key={client._id} className="glass-panel" style={{ padding: 0, overflow: 'hidden', border: '1px solid var(--border-color)' }}>
                  <div 
                    onClick={() => toggleExpand(client._id)}
                    style={{ 
                      padding: '16px 20px', 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center', 
                      cursor: 'pointer',
                      background: isExpanded ? 'rgba(255,255,255,0.01)' : 'transparent',
                      transition: 'background 0.2s ease'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ 
                        width: '38px', 
                        height: '38px', 
                        borderRadius: '8px', 
                        background: 'var(--accent-glow)', 
                        color: 'var(--accent-primary)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 700
                      }}>
                        {client.name.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{client.name}</div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{client.email || 'No email profile'}</div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                      <div style={{ textAlign: 'right' }}>
                        <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Engagements</span>
                        <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{client.engagements?.length || 0}</span>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Total Time</span>
                        <span style={{ fontWeight: 700, color: 'var(--accent-primary)' }}>{totalHours.toFixed(1)} hrs</span>
                      </div>
                      <div style={{ color: 'var(--text-muted)' }}>
                        {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                      </div>
                    </div>
                  </div>

                  {isExpanded && (
                    <div style={{ 
                      padding: '16px 20px', 
                      background: 'rgba(0,0,0,0.04)', 
                      borderTop: '1px solid var(--border-color)' 
                    }}>
                      {Object.keys(engagementBreakdown).length === 0 ? (
                        <p style={{ margin: 0, padding: '8px 0', fontSize: '0.85rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                          No hours logged for this client yet.
                        </p>
                      ) : (
                        <table className="data-table" style={{ margin: 0, fontSize: '0.8rem' }}>
                          <thead>
                            <tr style={{ background: 'var(--bg-tertiary)' }}>
                              <th>Engagement Scope</th>
                              <th>Default Type</th>
                              <th>Status</th>
                              <th style={{ textAlign: 'right' }}>Logged Hours</th>
                            </tr>
                          </thead>
                          <tbody>
                            {Object.entries(engagementBreakdown).map(([engName, details]) => (
                              <tr key={engName}>
                                <td style={{ fontWeight: 600 }}>{engName}</td>
                                <td>{details.workType || 'Audit'}</td>
                                <td>
                                  <span className={`badge badge-draft`} style={{ padding: '2px 6px', fontSize: '0.7rem' }}>
                                    {details.status.replace(/_/g, ' ')}
                                  </span>
                                </td>
                                <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--text-primary)' }}>
                                  {details.hours.toFixed(1)} hrs
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
