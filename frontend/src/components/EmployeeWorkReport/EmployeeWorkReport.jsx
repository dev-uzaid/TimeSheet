import React, { useState, useEffect } from 'react';
import { api } from '../../utils/api';
import { Briefcase, Users, ChevronDown, ChevronUp, FileText, Calendar, Clock } from 'lucide-react';

const EmployeeWorkReport = () => {
  const [employees, setEmployees] = useState([]);
  const [engagements, setEngagements] = useState([]);
  const [timesheets, setTimesheets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filter states
  const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'wip', 'completed'
  const [selectedEmployeeFilter, setSelectedEmployeeFilter] = useState('all');

  // Collapse states
  const [expandedEmployees, setExpandedEmployees] = useState({});

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [empData, engData, tsData] = await Promise.all([
          api.get('/employees').catch(() => []),
          api.get('/engagements').catch(() => []),
          api.get('/timesheets').catch(() => [])
        ]);
        setEmployees(empData.filter(emp => emp.role !== 'admin')); // Focus on staff and managers
        setEngagements(engData);
        setTimesheets(tsData);
      } catch (err) {
        console.error(err);
        setError('Failed to fetch report data.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleDownloadPDF = () => {
    window.print();
  };

  const toggleExpand = (empId) => {
    setExpandedEmployees(prev => ({
      ...prev,
      [empId]: !prev[empId]
    }));
  };

  if (loading) {
    return <p className="stat-desc" style={{ textAlign: 'center', padding: '32px' }}>Loading Work Reports...</p>;
  }

  if (error) {
    return <p className="stat-desc" style={{ textAlign: 'center', padding: '32px', color: 'var(--danger)' }}>{error}</p>;
  }

  const matchesStatus = (status) => {
    if (statusFilter === 'all') return true;
    if (statusFilter === 'wip') return ['unassigned', 'work_in_progress', 'review_pending'].includes(status);
    if (statusFilter === 'completed') return ['completed', 'billed'].includes(status);
    return true;
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
  };

  // Filter employees list
  const filteredEmployees = employees.filter(emp => {
    if (selectedEmployeeFilter !== 'all' && emp._id !== selectedEmployeeFilter) {
      return false;
    }
    return true;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Scope Style for Print Override */}
      <style>{`
        @media print {
          /* Hide app navigation sidebar, headers, filters, and standard elements */
          .sidebar, .header, .no-print, .tabs-container {
            display: none !important;
          }
          body, .main-content, .content-body {
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
            color: black !important;
            width: 100% !important;
            overflow: visible !important;
          }
          .glass-panel {
            border: none !important;
            box-shadow: none !important;
            background: transparent !important;
            margin-bottom: 24px !important;
            padding: 0 !important;
          }
          /* Ensure all collapsible containers expand in PDF */
          .collapse-content {
            display: block !important;
          }
          .chevron-icon {
            display: none !important;
          }
          .data-table {
            width: 100% !important;
            border-collapse: collapse !important;
            color: black !important;
          }
          .data-table th {
            background-color: #f3f4f6 !important;
            color: #111827 !important;
            border: 1px solid #d1d5db !important;
          }
          .data-table td {
            border: 1px solid #d1d5db !important;
            color: #374151 !important;
            background: transparent !important;
          }
          .badge {
            border: 1px solid #9ca3af !important;
            background: transparent !important;
            color: black !important;
            font-size: 0.75rem !important;
          }
        }
      `}</style>

      {/* Header Row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ fontSize: '1.8rem', fontWeight: 700, color: 'var(--text-primary)' }}>Employee Work Report</h2>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: '4px' }}>All assignments per employee with hours logged</p>
        </div>
        <button 
          onClick={handleDownloadPDF} 
          className="btn btn-secondary no-print" 
          style={{ borderColor: 'rgba(239, 68, 68, 0.3)', color: '#f87171', background: 'rgba(239, 68, 68, 0.05)', display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <FileText size={16} />
          Download PDF
        </button>
      </div>

      {/* Filters Row */}
      <div className="glass-panel no-print" style={{ padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
        {/* Status Filters */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
          <span style={{ fontWeight: 500, color: 'var(--text-secondary)', fontSize: '0.95rem' }}>Filter by Status:</span>
          
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', marginBottom: 0 }}>
            <input 
              type="radio" 
              name="statusFilter" 
              checked={statusFilter === 'all'} 
              onChange={() => setStatusFilter('all')} 
              style={{ width: '16px', height: '16px', accentColor: 'var(--accent-primary)' }} 
            />
            <span style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>All</span>
          </label>

          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', marginBottom: 0 }}>
            <input 
              type="radio" 
              name="statusFilter" 
              checked={statusFilter === 'wip'} 
              onChange={() => setStatusFilter('wip')} 
              style={{ width: '16px', height: '16px', accentColor: 'var(--accent-primary)' }} 
            />
            <span style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>Work in Progress</span>
          </label>

          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', marginBottom: 0 }}>
            <input 
              type="radio" 
              name="statusFilter" 
              checked={statusFilter === 'completed'} 
              onChange={() => setStatusFilter('completed')} 
              style={{ width: '16px', height: '16px', accentColor: 'var(--accent-primary)' }} 
            />
            <span style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>Completed</span>
          </label>
        </div>

        {/* Employee Filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Users size={16} style={{ color: 'var(--text-muted)' }} />
          <select 
            className="form-control" 
            value={selectedEmployeeFilter} 
            onChange={(e) => setSelectedEmployeeFilter(e.target.value)}
            style={{ padding: '6px 12px', fontSize: '0.9rem', width: '180px', minHeight: '38px' }}
          >
            <option value="all">All Employees</option>
            {employees.map(emp => (
              <option key={emp._id} value={emp._id}>{emp.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Employees Reports List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {filteredEmployees.length === 0 ? (
          <div className="glass-panel" style={{ padding: '32px', textAlign: 'center', color: 'var(--text-secondary)' }}>
            No employees found matching the filters.
          </div>
        ) : (
          filteredEmployees.map(emp => {
            // Find active assignments matching the status filter
            const empAssignments = engagements.filter(engage => {
              const isAssigned = engage.assignedStaff?.some(s => {
                const id = typeof s === 'object' ? s._id : s;
                return id === emp._id;
              });
              return isAssigned && matchesStatus(engage.status);
            });

            // Calculate total hours logged by this employee across ALL engagements
            const totalHours = timesheets
              .filter(t => {
                const tEmpId = typeof t.employeeId === 'object' ? t.employeeId._id : t.employeeId;
                return tEmpId === emp._id;
              })
              .reduce((sum, t) => sum + t.hours, 0);

            const isExpanded = !!expandedEmployees[emp._id];

            return (
              <div key={emp._id} className="glass-panel" style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                {/* Employee Header Panel */}
                <div 
                  onClick={() => toggleExpand(emp._id)}
                  style={{ 
                    padding: '20px 24px', 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center', 
                    cursor: 'pointer',
                    userSelect: 'none',
                    background: isExpanded ? 'rgba(255, 255, 255, 0.01)' : 'transparent',
                    transition: 'background 0.2s ease'
                  }}
                >
                  {/* Left Side: Avatar, Name, Email */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ 
                      width: '42px', 
                      height: '42px', 
                      borderRadius: '50%', 
                      background: 'rgba(99, 102, 241, 0.1)', 
                      color: 'var(--accent-primary)', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center', 
                      fontWeight: 700, 
                      fontSize: '1.05rem',
                      border: '1px solid rgba(99, 102, 241, 0.2)'
                    }}>
                      {getInitials(emp.name)}
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '1.05rem', color: 'var(--text-primary)' }}>{emp.name}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>{emp.email}</div>
                    </div>
                  </div>

                  {/* Right Side: Stats & Chevron */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
                    <div style={{ display: 'flex', gap: '24px' }}>
                      <div style={{ textAlign: 'right' }}>
                        <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Assignments</span>
                        <span style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '2px', display: 'inline-block' }}>{empAssignments.length}</span>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Total Hours</span>
                        <span style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--accent-primary)', marginTop: '2px', display: 'inline-block' }}>{totalHours.toFixed(1)}h</span>
                      </div>
                    </div>
                    
                    <div className="chevron-icon" style={{ color: 'var(--text-muted)' }}>
                      {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                    </div>
                  </div>
                </div>

                {/* Collapsible Assignments Table */}
                <div 
                  className="collapse-content"
                  style={{ 
                    display: isExpanded ? 'block' : 'none', 
                    padding: '0 24px 24px 24px',
                    borderTop: '1px solid var(--border-color)',
                    background: 'rgba(0, 0, 0, 0.05)'
                  }}
                >
                  {empAssignments.length === 0 ? (
                    <p style={{ padding: '24px 0 8px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem', fontStyle: 'italic' }}>
                      No assignments matching status filters.
                    </p>
                  ) : (
                    <div className="table-wrapper" style={{ marginTop: '20px', border: '1px solid var(--border-color)', borderRadius: '6px' }}>
                      <table className="data-table">
                        <thead>
                          <tr>
                            <th>Client</th>
                            <th>Project</th>
                            <th>Work Type</th>
                            <th>Due Date</th>
                            <th>Status</th>
                            <th style={{ textAlign: 'right' }}>Hours Logged</th>
                          </tr>
                        </thead>
                        <tbody>
                          {empAssignments.map(engage => {
                            // Sum timesheet hours logged by this employee for this engagement
                            const hoursLogged = timesheets
                              .filter(t => {
                                const tEmpId = typeof t.employeeId === 'object' ? t.employeeId._id : t.employeeId;
                                const tEngId = typeof t.engagementId === 'object' ? t.engagementId._id : t.engagementId;
                                return tEmpId === emp._id && tEngId === engage._id;
                              })
                              .reduce((sum, t) => sum + t.hours, 0);

                            return (
                              <tr key={engage._id}>
                                <td style={{ fontWeight: 600, fontSize: '0.9rem' }}>
                                  {engage.clientId?.name || 'Internal Client'}
                                </td>
                                <td>
                                  <div style={{ fontSize: '0.9rem', color: 'var(--text-primary)', fontWeight: 500 }}>{engage.name}</div>
                                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>ID: {engage._id}</div>
                                </td>
                                <td>
                                  <span className="badge badge-submitted" style={{ padding: '3px 8px', fontSize: '0.75rem', textTransform: 'none' }}>
                                    {engage.workType || 'Unassigned'}
                                  </span>
                                </td>
                                <td>
                                  {engage.dueDate ? new Date(engage.dueDate).toISOString().split('T')[0] : '—'}
                                </td>
                                <td>
                                  <span className={`badge badge-${
                                    engage.status === 'completed' || engage.status === 'billed' 
                                      ? 'approved' 
                                      : engage.status === 'work_in_progress' 
                                      ? 'submitted' 
                                      : 'draft'
                                  }`}>
                                    {engage.status === 'work_in_progress' ? 'Work in Progress' : engage.status.replace(/_/g, ' ')}
                                  </span>
                                </td>
                                <td style={{ textAlign: 'right', fontWeight: 600, color: hoursLogged > 0 ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                                  {hoursLogged > 0 ? `${hoursLogged.toFixed(1)}h` : '—'}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default EmployeeWorkReport;