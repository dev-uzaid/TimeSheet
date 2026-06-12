import React, { useState, useEffect, useRef } from 'react';
import { Briefcase, Plus, RefreshCw, Calendar, Users, Upload, AlertCircle, CheckCircle, Download } from 'lucide-react';
import { useGetEngagementsQuery, useCreateEngagementMutation, useUpdateEngagementMutation, useBulkCreateEngagementsMutation } from '../../redux/services/engagementApi';
import { useGetClientsQuery } from '../../redux/services/clientApi';
import { useGetEmployeesQuery } from '../../redux/services/employeeApi';
import axios from 'axios';
import { BASE_URL } from '../../utils/api';

export default function EngagementModule({ user }) {
  // RTK Query hooks
  const { data: engagements, isLoading: engsLoading, isError: engsError } = useGetEngagementsQuery();
  const { data: clients, isLoading: clientsLoading } = useGetClientsQuery();
  const { data: employees, isLoading: empsLoading } = useGetEmployeesQuery();

  const [createEngagement, { isLoading: createSubmitting }] = useCreateEngagementMutation();
  const [updateEngagement] = useUpdateEngagementMutation();

  // Bulk Upload States
  const [bulkCreateEngagements, { isLoading: isBulkSubmitting }] = useBulkCreateEngagementsMutation();
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkFile, setBulkFile] = useState(null);
  const [bulkData, setBulkData] = useState([]);
  const [bulkErrors, setBulkErrors] = useState([]);
  const [bulkLog, setBulkLog] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef(null);

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
      const res = await axios.get(`${BASE_URL}/workType`);
      if (res.data) {
        console.log(res.data);
        setWorkTypes(res.data);
      }
    } catch (error) {
      console.log(error);
    }
  }

  const isManagerOrAdmin = user.role === 'manager' || user.role === 'admin';

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      processFile(files[0]);
    }
  };

  const handleFileChange = (e) => {
    const files = e.target.files;
    if (files.length > 0) {
      processFile(files[0]);
    }
  };

  const processFile = (file) => {
    if (!file.name.endsWith('.csv')) {
      setBulkErrors(['Invalid file format. Please upload a standard .csv file.']);
      setBulkData([]);
      return;
    }
    setBulkFile(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target.result;
      const parsed = parseCSV(text);
      validateBulkData(parsed);
    };
    reader.readAsText(file);
  };

  const parseCSV = (text) => {
    const lines = [];
    let row = [""];
    let insideQuote = false;

    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      const nextChar = text[i + 1];

      if (char === '"') {
        if (insideQuote && nextChar === '"') {
          row[row.length - 1] += '"';
          i++;
        } else {
          insideQuote = !insideQuote;
        }
      } else if (char === ',' && !insideQuote) {
        row.push('');
      } else if ((char === '\r' || char === '\n') && !insideQuote) {
        if (char === '\r' && nextChar === '\n') {
          i++;
        }
        lines.push(row);
        row = [''];
      } else {
        row[row.length - 1] += char;
      }
    }
    if (row.length > 1 || row[0] !== '') {
      lines.push(row);
    }

    if (lines.length === 0) return [];
    
    const headers = lines[0].map(h => h.trim());
    const data = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i];
      if (values.length === 0 || (values.length === 1 && values[0].trim() === '')) continue;
      const obj = {};
      headers.forEach((header, index) => {
        obj[header] = values[index] !== undefined ? values[index].trim() : '';
      });
      data.push(obj);
    }
    return data;
  };

  const validateBulkData = (data) => {
    const errors = [];
    const validated = [];

    data.forEach((row, idx) => {
      const clientNameKey = Object.keys(row).find(k => ['clientname', 'client name', 'client', 'company'].includes(k.toLowerCase().trim().replace(/\s/g, '')));
      const nameKey = Object.keys(row).find(k => ['name', 'engagementname', 'engagement name', 'projectname', 'project name', 'project', 'engagement'].includes(k.toLowerCase().trim().replace(/\s/g, '')));
      const workTypeKey = Object.keys(row).find(k => ['worktype', 'work type', 'type', 'work'].includes(k.toLowerCase().trim().replace(/\s/g, '')));
      const dueDateKey = Object.keys(row).find(k => ['duedate', 'due date', 'due', 'date'].includes(k.toLowerCase().trim().replace(/\s/g, '')));
      const statusKey = Object.keys(row).find(k => ['status', 'engagementstatus', 'engagement status'].includes(k.toLowerCase().trim().replace(/\s/g, '')));
      const billableKey = Object.keys(row).find(k => ['billable', 'isbillable', 'is billable'].includes(k.toLowerCase().trim().replace(/\s/g, '')));

      const clientName = clientNameKey ? row[clientNameKey] : '';
      const name = nameKey ? row[nameKey] : '';
      const workType = workTypeKey ? row[workTypeKey] : '';
      const dueDate = dueDateKey ? row[dueDateKey] : '';
      const status = statusKey ? row[statusKey] : 'unassigned';
      const billable = billableKey ? row[billableKey] : 'true';

      if (!clientName) {
        errors.push(`Row ${idx + 1}: Client Name is missing.`);
      }
      if (!name) {
        errors.push(`Row ${idx + 1}: Engagement Name is missing.`);
      }
      if (!workType) {
        errors.push(`Row ${idx + 1}: Work Type is missing.`);
      }
      if (!dueDate) {
        errors.push(`Row ${idx + 1}: Due Date is missing.`);
      } else if (isNaN(new Date(dueDate).getTime())) {
        errors.push(`Row ${idx + 1}: Invalid Due Date format (expected YYYY-MM-DD).`);
      }

      validated.push({
        clientName,
        name,
        workType,
        dueDate,
        status: status || 'unassigned',
        billable: billable || 'true'
      });
    });

    setBulkErrors(errors);
    setBulkData(validated);
  };

  const handleDownloadTemplate = () => {
    const csvContent = "data:text/csv;charset=utf-8," 
      + "Client Name,Engagement Name,Work Type,Due Date,Status,Billable\n"
      + "Acme Corporation,Acme Audit Q3,Consultation,2026-09-30,unassigned,true\n"
      + "Global Industries,Tax Planning,Taxation,2026-12-31,work_in_progress,true\n";
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "engagements_bulk_upload_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleBulkSubmit = async () => {
    if (bulkData.length === 0) return;
    if (bulkErrors.length > 0) {
      if (!window.confirm("There are validation warnings. Rows with errors will be skipped. Do you want to proceed?")) {
        return;
      }
    }

    try {
      const validRows = bulkData.filter(r => r.clientName && r.name && r.workType && r.dueDate && !isNaN(new Date(r.dueDate).getTime()));
      if (validRows.length === 0) {
        alert("No valid rows to upload.");
        return;
      }

      const res = await bulkCreateEngagements(validRows).unwrap();
      setBulkLog(res);
      setBulkFile(null);
      setBulkData([]);
      setBulkErrors([]);
    } catch (err) {
      console.error(err);
      alert(err.data?.message || err.message || "Failed to upload bulk engagements");
    }
  };

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
            <div style={{ display: 'flex', gap: '8px' }}>
              <button 
                onClick={() => {
                  setBulkFile(null);
                  setBulkData([]);
                  setBulkErrors([]);
                  setBulkLog(null);
                  setShowBulkModal(true);
                }} 
                className="btn btn-secondary" 
                style={{ display: 'flex', alignItems: 'center', gap: '6px', height: '40px', padding: '0 16px' }}
              >
                <Upload size={18} />
                Bulk Upload
              </button>
              <button onClick={() => setShowEngageModal(true)} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '6px', height: '40px', padding: '0 16px' }}>
                <Plus size={18} />
                New Engagement
              </button>
            </div>
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

      {/* Bulk Engagement Upload Modal */}
      {showBulkModal && (
        <div className="modal-overlay">
          <div className="glass-panel modal-content" style={{ maxWidth: '750px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="modal-header">
              <h3>Bulk Upload Client Engagements</h3>
              <button className="modal-close" onClick={() => setShowBulkModal(false)}>Close</button>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '12px' }}>
                Upload multiple engagements/projects in bulk using a CSV file. If a Client Company name does not exist in the directory, a new corporate client account will be created automatically on the fly.
              </p>
              <button 
                type="button" 
                className="btn btn-secondary btn-sm"
                onClick={handleDownloadTemplate}
                style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem' }}
              >
                <Download size={14} />
                Download CSV Template
              </button>
            </div>

            {/* Drag & Drop Area */}
            <div 
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current.click()}
              style={{
                border: dragOver ? '2px dashed var(--accent-primary)' : '2px dashed var(--border-color)',
                borderRadius: '12px',
                padding: '30px 20px',
                textAlign: 'center',
                background: dragOver ? 'var(--accent-glow)' : 'var(--bg-tertiary)',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                marginBottom: '20px'
              }}
            >
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                accept=".csv" 
                style={{ display: 'none' }} 
              />
              <Upload size={32} style={{ color: 'var(--accent-primary)', marginBottom: '12px', margin: '0 auto' }} />
              <p style={{ margin: '8px 0 4px 0', fontWeight: 600 }}>
                {bulkFile ? bulkFile.name : "Drag & Drop CSV File here or Click to Browse"}
              </p>
              {bulkFile && (
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Size: {(bulkFile.size / 1024).toFixed(2)} KB
                </span>
              )}
            </div>

            {/* Bulk Log Outcome */}
            {bulkLog && (
              <div style={{ 
                background: 'var(--bg-secondary)', 
                border: '1px solid var(--border-color)', 
                borderRadius: '8px', 
                padding: '16px', 
                marginBottom: '20px' 
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', color: 'var(--accent-primary)' }}>
                  <CheckCircle size={18} />
                  <span style={{ fontWeight: 600 }}>Upload Results</span>
                </div>
                <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-primary)', fontWeight: 500 }}>
                  {bulkLog.message}
                </p>
                {bulkLog.errors && bulkLog.errors.length > 0 && (
                  <div style={{ marginTop: '12px' }}>
                    <div style={{ fontSize: '0.85rem', color: 'var(--danger)', fontWeight: 600, marginBottom: '4px' }}>
                      Row-level processing warnings ({bulkLog.errors.length}):
                    </div>
                    <ul style={{ maxHeight: '120px', overflowY: 'auto', margin: 0, paddingLeft: '20px', fontSize: '0.8rem', color: 'var(--danger)' }}>
                      {bulkLog.errors.map((err, i) => (
                        <li key={i}>{err}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* Validation Warnings */}
            {bulkErrors.length > 0 && (
              <div style={{ 
                background: 'var(--accent-glow)', 
                border: '1px solid var(--accent-primary)', 
                borderRadius: '8px', 
                padding: '16px', 
                marginBottom: '20px' 
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', color: 'var(--accent-primary)' }}>
                  <AlertCircle size={18} />
                  <span style={{ fontWeight: 600 }}>Validation Warnings ({bulkErrors.length})</span>
                </div>
                <ul style={{ maxHeight: '100px', overflowY: 'auto', margin: 0, paddingLeft: '20px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  {bulkErrors.map((err, i) => (
                    <li key={i}>{err}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* CSV Data Preview */}
            {bulkData.length > 0 && (
              <div style={{ marginBottom: '20px' }}>
                <h4 style={{ marginBottom: '8px', fontSize: '0.95rem' }}>Data Preview ({bulkData.length} rows)</h4>
                <div style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
                  <table className="data-table" style={{ margin: 0, fontSize: '0.8rem' }}>
                    <thead>
                      <tr style={{ background: 'var(--bg-tertiary)' }}>
                        <th>Client Company</th>
                        <th>Engagement Name</th>
                        <th>Work Type</th>
                        <th>Due Date</th>
                        <th>Status</th>
                        <th>Billable</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bulkData.map((row, i) => {
                        const hasClient = !!row.clientName;
                        const hasName = !!row.name;
                        const hasWorkType = !!row.workType;
                        const hasDueDate = !!row.dueDate && !isNaN(new Date(row.dueDate).getTime());

                        return (
                          <tr key={i} style={{ borderBottom: '1px solid var(--border-color)' }}>
                            <td style={{ fontWeight: 600, color: hasClient ? 'inherit' : 'var(--danger)' }}>
                              {row.clientName || '[Missing Client]'}
                            </td>
                            <td style={{ color: hasName ? 'inherit' : 'var(--danger)' }}>
                              {row.name || '[Missing Name]'}
                            </td>
                            <td style={{ color: hasWorkType ? 'inherit' : 'var(--danger)' }}>
                              {row.workType || '[Missing Work Type]'}
                            </td>
                            <td style={{ color: hasDueDate ? 'inherit' : 'var(--danger)' }}>
                              {row.dueDate || '[Missing/Invalid Due Date]'}
                            </td>
                            <td>{row.status}</td>
                            <td>{row.billable}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '16px' }}>
              <button 
                type="button" 
                className="btn btn-secondary" 
                onClick={() => setShowBulkModal(false)}
                disabled={isBulkSubmitting}
              >
                Close
              </button>
              {bulkData.length > 0 && (
                <button 
                  type="button" 
                  className="btn btn-primary" 
                  onClick={handleBulkSubmit}
                  disabled={isBulkSubmitting}
                >
                  {isBulkSubmitting ? 'Uploading...' : 'Submit Upload'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
