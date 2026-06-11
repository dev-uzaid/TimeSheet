import React, { useState, useEffect } from 'react';
import { Briefcase, Plus, RefreshCw, Calendar, Users } from 'lucide-react';
import { useGetEngagementsQuery, useCreateEngagementMutation, useUpdateEngagementMutation } from '../../redux/services/engagementApi';
import { useGetClientsQuery } from '../../redux/services/clientApi';
import { useGetEmployeesQuery } from '../../redux/services/employeeApi';
import axios from 'axios';

export default function EngagementModule({ user }) {
  // RTK Query hooks
  const { data: engagements, isLoading: engsLoading, isError: engsError } = useGetEngagementsQuery();
  const { data: clients, isLoading: clientsLoading } = useGetClientsQuery();
  const { data: employees, isLoading: empsLoading } = useGetEmployeesQuery();

  const [createEngagement, { isLoading: createSubmitting }] = useCreateEngagementMutation();
  const [updateEngagement] = useUpdateEngagementMutation();

  // Modals state
  const [showEngageModal, setShowEngageModal] = useState(false);
  const [engageClientId, setEngageClientId] = useState('');
  const [engageName, setEngageName] = useState('');
  const [engageStatus, setEngageStatus] = useState('unassigned');
  const [engageDueDate, setEngageDueDate] = useState('');
  const [engageBillable, setEngageBillable] = useState(true);
  const [engageStaff, setEngageStaff] = useState([]); // array of employee IDs
  const [workTypes, setWorkTypes] = useState([]);
  const [selectedWorkType, setSelectedWorkType] = useState('');

  const [editingEngagement, setEditingEngagement] = useState(null);
  const [editName, setEditName] = useState('');
  const [editClientId, setEditClientId] = useState('');
  const [editStatus, setEditStatus] = useState('');
  const [editWorkType, setEditWorkType] = useState('');
  const [editDueDate, setEditDueDate] = useState('');
  const [editBillable, setEditBillable] = useState(true);
  const [editStaff, setEditStaff] = useState([]);
  const [errorMsg, setErrorMsg] = useState('');

  // Set default client selection when clients load
  useEffect(() => {
    if (clients && clients.length > 0 && !engageClientId) {
      setEngageClientId(clients[0]._id);
    }
  }, [clients, engageClientId]);

  const handleCreateEngagement = async (e) => {
    e.preventDefault();
    if (!engageClientId || !engageName || !engageDueDate || !selectedWorkType) {
      setErrorMsg("Please fill in all mandatory fields, including Work Type.");
      return;
    }

    try {
      setErrorMsg("");
      await createEngagement({
        clientId: engageClientId,
        name: engageName,
        status: engageStatus,
        dueDate: engageDueDate,
        workType: selectedWorkType,
        billable: engageBillable,
        assignedStaff: engageStaff
      }).unwrap();

      // Reset and close
      setShowEngageModal(false);
      setEngageName('');
      setEngageDueDate('');
      setEngageStaff([]);
      setEngageStatus('unassigned');
      setSelectedWorkType('');
      if (clients && clients.length > 0) setEngageClientId(clients[0]._id);
    } catch (err) {
      console.error(err);
      setErrorMsg(err.data?.message || err.message || "Failed to create engagement.");
    }
  };

  const handleEditEngagementSubmit = async (e) => {
    e.preventDefault();
    if (!editClientId || !editName || !editDueDate || !editWorkType) {
      setErrorMsg("Please fill in all mandatory fields.");
      return;
    }

    try {
      setErrorMsg("");
      await updateEngagement({
        id: editingEngagement._id,
        clientId: editClientId,
        name: editName,
        status: editStatus,
        dueDate: editDueDate,
        workType: editWorkType,
        billable: editBillable,
        assignedStaff: editStaff
      }).unwrap();
      setEditingEngagement(null);
    } catch (err) {
      console.error(err);
      setErrorMsg(err.data?.message || err.message || "Failed to update engagement.");
    }
  };

  const handleStaffToggle = (empId) => {
    if (engageStaff.includes(empId)) {
      setEngageStaff(engageStaff.filter(id => id !== empId));
    } else {
      setEngageStaff([...engageStaff, empId]);
    }
  };

  useEffect(() => {
    fetchWorkTypes();
  }, [])

  const fetchWorkTypes = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/workType');
      if (res.data) {
        console.log(res.data);
        setWorkTypes(res.data);
      }
    } catch (error) {
      console.log(error);
    }
  }

  const isManagerOrAdmin = user.role === 'manager' || user.role === 'admin';

  return (
    <div>
      {/* Engagements Board header */}
      <div className="glass-panel section-card" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Briefcase size={24} style={{ color: 'var(--accent-primary)' }} />
            <h2 style={{ fontSize: '1.25rem', margin: 0 }}>Client Engagements Project Board</h2>
          </div>
          {isManagerOrAdmin && (
            <button onClick={() => setShowEngageModal(true)} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '6px', height: '40px', padding: '0 16px' }}>
              <Plus size={18} />
              New Engagement
            </button>
          )}
        </div>
      </div>

      {/* Engagements Table */}
      <div className="glass-panel section-card">
        <div className="section-header">
          <h3>Engagements Portfolio ({engagements?.length || 0})</h3>
        </div>

        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Project Scope</th>
                <th>Client Profile</th>
                <th>Billable</th>
                <th>Delivery Target</th>
                <th>Assigned Staff</th>
                <th>Lifecycle Status</th>
                {isManagerOrAdmin && <th style={{ textAlign: 'right' }}>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {engsLoading ? (
                <tr>
                  <td colSpan={isManagerOrAdmin ? 7 : 6} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-secondary)' }}>
                    Loading engagements portfolio...
                  </td>
                </tr>
              ) : engsError ? (
                <tr>
                  <td colSpan={isManagerOrAdmin ? 7 : 6} style={{ textAlign: 'center', padding: '32px', color: 'var(--danger)', fontWeight: 600 }}>
                    Failed to load engagements data.
                  </td>
                </tr>
              ) : !engagements || engagements.length === 0 ? (
                <tr>
                  <td colSpan={isManagerOrAdmin ? 7 : 6} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-secondary)' }}>
                    No active project scopes found.
                  </td>
                </tr>
              ) : (
                engagements.map((engage) => (
                  <tr key={engage._id}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{engage.name}</div>
                      {engage.workType && (
                        <span className="badge badge-draft" style={{ fontSize: '0.7rem', padding: '2px 8px', marginTop: '4px', display: 'inline-block' }}>
                          {engage.workType}
                        </span>
                      )}
                    </td>
                    <td>
                      {engage.clientId ? (
                        <div>
                          <div style={{ fontWeight: 500 }}>{engage.clientId.name}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{engage.clientId.industry}</div>
                        </div>
                      ) : (
                        <span style={{ color: 'var(--text-muted)' }}>Unknown Client</span>
                      )}
                    </td>
                    <td>
                      <span className={`badge ${engage.billable ? 'badge-success' : 'badge-draft'}`}>
                        {engage.billable ? 'Billable' : 'Non-Billable'}
                      </span>
                    </td>
                    <td>{new Date(engage.dueDate).toLocaleDateString()}</td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        {!engage.assignedStaff || engage.assignedStaff.length === 0 ? (
                          <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Unassigned</span>
                        ) : (
                          engage.assignedStaff.map(s => (
                            <span key={s._id} style={{ fontSize: '0.825rem', color: 'var(--text-secondary)' }}>• {s.name}</span>
                          ))
                        )}
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${engage.status === 'completed' ? 'badge-approved' :
                          engage.status === 'review_pending' ? 'badge-warning' :
                            engage.status === 'work_in_progress' ? 'badge-submitted' :
                              engage.status === 'billed' ? 'badge-approved' : 'badge-draft'
                        }`}>
                        {engage.status ? engage.status.replace(/_/g, ' ') : 'unassigned'}
                      </span>
                    </td>
                    {isManagerOrAdmin && (
                      <td style={{ textAlign: 'right' }}>
                        <button
                          onClick={() => {
                            setEditingEngagement(engage);
                            setEditName(engage.name || '');
                            setEditClientId(engage.clientId?._id || '');
                            setEditStatus(engage.status || 'unassigned');
                            setEditWorkType(engage.workType || '');
                            setEditDueDate(engage.dueDate ? engage.dueDate.split('T')[0] : '');
                            setEditBillable(engage.billable !== undefined ? engage.billable : true);
                            setEditStaff(engage.assignedStaff ? engage.assignedStaff.map(s => s._id) : []);
                          }}
                          className="btn btn-secondary btn-sm"
                          style={{ padding: '6px 12px' }}
                        >
                          Edit
                        </button>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Engagement Modal */}
      {showEngageModal && (
        <div className="modal-overlay">
          <div className="glass-panel modal-content" style={{ maxWidth: '620px' }}>
            <div className="modal-header">
              <h3>Define Scope of Engagement</h3>
              <button className="modal-close" onClick={() => setShowEngageModal(false)}>Close</button>
            </div>

            <form onSubmit={handleCreateEngagement}>
              {errorMsg && (
                <p className="stat-desc" style={{ color: 'var(--danger)', marginBottom: '16px', fontWeight: 600 }}>
                  {errorMsg}
                </p>
              )}

              <div className="form-group">
                <label>Corporate Client Account</label>
                <select
                  className="form-control"
                  value={engageClientId}
                  onChange={(e) => setEngageClientId(e.target.value)}
                  required
                >
                  <option value="">{clientsLoading ? "Loading clients list..." : "Select a client portfolio..."}</option>
                  {clients && clients.map(c => (
                    <option key={c._id} value={c._id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Engagement / Project Name</label>
                <input
                  type="text"
                  className="form-control"
                  required
                  placeholder="e.g. Audit & Assurance Q3"
                  value={engageName}
                  onChange={(e) => setEngageName(e.target.value)}
                />
              </div>

              {/* Select Work Types Section */}
              <div className="form-group">
                <label style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  Select Work Types <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 'normal' }}>(one engagement per type)</span>
                </label>
                <div style={{ 
                  display: 'flex', 
                  flexWrap: 'wrap', 
                  gap: '8px', 
                  border: '1px solid var(--border-color)', 
                  padding: '16px', 
                  borderRadius: '12px', 
                  background: 'var(--bg-tertiary)',
                  marginTop: '4px'
                }}>
                  {workTypes.map(w => {
                    const isSelected = selectedWorkType === w.name;
                    return (
                      <button
                        key={w._id}
                        type="button"
                        onClick={() => setSelectedWorkType(w.name)}
                        style={{
                          padding: '6px 14px',
                          borderRadius: '20px',
                          border: isSelected ? '1px solid var(--accent-primary)' : '1px solid var(--border-color)',
                          background: isSelected ? 'var(--accent-glow)' : 'transparent',
                          color: isSelected ? 'var(--accent-primary)' : 'var(--text-secondary)',
                          fontSize: '0.85rem',
                          fontWeight: 500,
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          outline: 'none',
                        }}
                        onMouseEnter={(e) => {
                          if (!isSelected) {
                            e.currentTarget.style.borderColor = 'var(--border-hover)';
                            e.currentTarget.style.color = 'var(--text-primary)';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!isSelected) {
                            e.currentTarget.style.borderColor = 'var(--border-color)';
                            e.currentTarget.style.color = 'var(--text-secondary)';
                          }
                        }}
                      >
                        {w.name}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Initial Status</label>
                  <select
                    className="form-control"
                    value={engageStatus}
                    onChange={(e) => setEngageStatus(e.target.value)}
                  >
                    <option value="">Status</option>
                    <option value="work_in_progress">Work in Progress</option>
                    <option value="review_pending">Review Pending</option>
                    <option value="completed">Completed</option>
                    <option value="billed">Billed</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Due Date</label>
                  <input
                    type="date"
                    className="form-control"
                    required
                    value={engageDueDate}
                    onChange={(e) => setEngageDueDate(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group" style={{ flexDirection: 'row', gap: '8px', alignItems: 'center', margin: '8px 0 16px 0' }}>
                <input
                  type="checkbox"
                  id="billable"
                  checked={engageBillable}
                  onChange={(e) => setEngageBillable(e.target.checked)}
                  style={{ width: '18px', height: '18px' }}
                />
                <label htmlFor="billable" style={{ cursor: 'pointer', marginBottom: 0 }}>This is a billable project scope</label>
              </div>

              <div className="form-group">
                <label>Assign Delivery Staff (Select multiple)</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', maxHeight: '140px', overflowY: 'auto', border: '1px solid var(--border-color)', padding: '12px', borderRadius: '8px', background: 'var(--bg-tertiary)' }}>
                  {empsLoading ? (
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Loading staff members...</p>
                  ) : employees && employees.filter(e => e.role === 'staff').length === 0 ? (
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>No staff members available.</p>
                  ) : (
                    employees && employees.filter(e => e.role === 'staff').map(emp => (
                      <div key={emp._id} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <input
                          type="checkbox"
                          id={`emp-${emp._id}`}
                          checked={engageStaff.includes(emp._id)}
                          onChange={() => handleStaffToggle(emp._id)}
                          style={{ width: '16px', height: '16px' }}
                        />
                        <label htmlFor={`emp-${emp._id}`} style={{ cursor: 'pointer', fontSize: '0.85rem', marginBottom: 0 }}>{emp.name}</label>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '16px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowEngageModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={createSubmitting}>
                  {createSubmitting ? 'Creating...' : 'Initialize Engagement'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Engagement Scope Modal */}
      {editingEngagement && (
        <div className="modal-overlay">
          <div className="glass-panel modal-content" style={{ maxWidth: '620px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="modal-header">
              <h3>Edit Engagement Scope</h3>
              <button className="modal-close" onClick={() => setEditingEngagement(null)}>Close</button>
            </div>
            <form onSubmit={handleEditEngagementSubmit}>
              {errorMsg && (
                <p className="stat-desc" style={{ color: 'var(--danger)', marginBottom: '16px', fontWeight: 600 }}>
                  {errorMsg}
                </p>
              )}

              <div className="form-group">
                <label>Corporate Client Account</label>
                <select
                  className="form-control"
                  value={editClientId}
                  onChange={(e) => setEditClientId(e.target.value)}
                  required
                >
                  <option value="">Select a client portfolio...</option>
                  {clients && clients.map(c => (
                    <option key={c._id} value={c._id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Engagement / Project Name</label>
                <input
                  type="text"
                  className="form-control"
                  required
                  placeholder="e.g. Audit & Assurance Q3"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  Select Work Type <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 'normal' }}>(one engagement per type)</span>
                </label>
                <div style={{ 
                  display: 'flex', 
                  flexWrap: 'wrap', 
                  gap: '8px', 
                  border: '1px solid var(--border-color)', 
                  padding: '12px', 
                  borderRadius: '8px', 
                  background: 'var(--bg-tertiary)',
                  marginTop: '4px'
                }}>
                  {workTypes.map(w => {
                    const isSelected = editWorkType === w.name;
                    return (
                      <button
                        key={w._id}
                        type="button"
                        onClick={() => setEditWorkType(w.name)}
                        style={{
                          padding: '5px 12px',
                          borderRadius: '20px',
                          border: isSelected ? '1px solid var(--accent-primary)' : '1px solid var(--border-color)',
                          background: isSelected ? 'var(--accent-glow)' : 'transparent',
                          color: isSelected ? 'var(--accent-primary)' : 'var(--text-secondary)',
                          fontSize: '0.8rem',
                          fontWeight: 500,
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          outline: 'none',
                        }}
                      >
                        {w.name}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Lifecycle Status</label>
                  <select
                    className="form-control"
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value)}
                  >
                    <option value="">Status</option>
                    <option value="work_in_progress">Work in Progress</option>
                    <option value="review_pending">Review Pending</option>
                    <option value="completed">Completed</option>
                    <option value="billed">Billed</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Due Date</label>
                  <input
                    type="date"
                    className="form-control"
                    required
                    value={editDueDate}
                    onChange={(e) => setEditDueDate(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group" style={{ flexDirection: 'row', gap: '8px', alignItems: 'center', margin: '8px 0 16px 0' }}>
                <input
                  type="checkbox"
                  id="editBillable"
                  checked={editBillable}
                  onChange={(e) => setEditBillable(e.target.checked)}
                  style={{ width: '18px', height: '18px' }}
                />
                <label htmlFor="editBillable" style={{ cursor: 'pointer', marginBottom: 0 }}>This is a billable project scope</label>
              </div>

              <div className="form-group">
                <label>Assign Delivery Staff (Select multiple)</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', maxHeight: '120px', overflowY: 'auto', border: '1px solid var(--border-color)', padding: '12px', borderRadius: '8px', background: 'var(--bg-tertiary)' }}>
                  {empsLoading ? (
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Loading staff members...</p>
                  ) : employees && employees.filter(e => e.role === 'staff').length === 0 ? (
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>No staff members available.</p>
                  ) : (
                    employees && employees.filter(e => e.role === 'staff').map(emp => (
                      <div key={emp._id} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <input
                          type="checkbox"
                          id={`edit-emp-${emp._id}`}
                          checked={editStaff.includes(emp._id)}
                          onChange={() => {
                            if (editStaff.includes(emp._id)) {
                              setEditStaff(editStaff.filter(id => id !== emp._id));
                            } else {
                              setEditStaff([...editStaff, emp._id]);
                            }
                          }}
                          style={{ width: '16px', height: '16px' }}
                        />
                        <label htmlFor={`edit-emp-${emp._id}`} style={{ cursor: 'pointer', fontSize: '0.85rem', marginBottom: 0 }}>{emp.name}</label>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setEditingEngagement(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
