import React, { useState, useEffect, useRef } from 'react';
import { useGetClientsQuery, useAddClientMutation, useUpdateClientMutation, useBulkAddClientsMutation } from '../../redux/services/clientApi';
import { useGetEmployeesQuery } from '../../redux/services/employeeApi';
import { Building, Plus, Upload, AlertCircle, CheckCircle, Download } from 'lucide-react';
import { getStoredUser } from '../../utils/api';
import axios from 'axios';

export default function ClientModule() {
  const { data: clients, isLoading, isError } = useGetClientsQuery();
  const [addClient, { isLoading: isSubmitting }] = useAddClientMutation();
  const [updateClient] = useUpdateClientMutation();
  const { data: employees, isLoading: empsLoading } = useGetEmployeesQuery();
  const currentUser = getStoredUser();

  // Modal Control (Add Client)
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [status, setStatus] = useState('Active');
  const [errorMsg, setErrorMsg] = useState('');

  // Simultaneous Engagement Control
  const [createCustomEngagement, setCreateCustomEngagement] = useState(false);
  const [engageName, setEngageName] = useState('');
  const [workTypes, setWorkTypes] = useState([]);
  const [selectedWorkType, setSelectedWorkType] = useState('');
  const [engageDueDate, setEngageDueDate] = useState('');
  const [engageStatus, setEngageStatus] = useState('unassigned');
  const [engageBillable, setEngageBillable] = useState(true);
  const [engageStaff, setEngageStaff] = useState([]);

  // Edit Client Modal
  const [editingClient, setEditingClient] = useState(null);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editMobile, setEditMobile] = useState('');
  const [editStatus, setEditStatus] = useState('Active');

  // Bulk Upload States
  const [bulkAddClients, { isLoading: isBulkSubmitting }] = useBulkAddClientsMutation();
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkFile, setBulkFile] = useState(null);
  const [bulkData, setBulkData] = useState([]);
  const [bulkErrors, setBulkErrors] = useState([]);
  const [bulkLog, setBulkLog] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (showModal) {
      fetchWorkTypes();
    }
  }, [showModal]);

  const fetchWorkTypes = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/workType');
      if (res.data) {
        setWorkTypes(res.data);
      }
    } catch (error) {
      console.log(error);
    }
  };

  const handleStaffToggle = (empId) => {
    if (engageStaff.includes(empId)) {
      setEngageStaff(engageStaff.filter(id => id !== empId));
    } else {
      setEngageStaff([...engageStaff, empId]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name) {
      setErrorMsg("Please fill in all mandatory fields.");
      return;
    }

    if (createCustomEngagement && (!engageName || !selectedWorkType || !engageDueDate)) {
      setErrorMsg("Please fill in all mandatory engagement fields.");
      return;
    }

    try {
      setErrorMsg("");
      const payload = {
        name,
        email,
        mobile,
        status
      };

      if (createCustomEngagement) {
        payload.engagementName = engageName;
        payload.engagementWorkType = selectedWorkType;
        payload.engagementDueDate = engageDueDate;
        payload.engagementStatus = engageStatus;
        payload.engagementBillable = engageBillable;
        payload.engagementAssignedStaff = engageStaff;
      }

      await addClient(payload).unwrap();
      
      // Reset & close
      setShowModal(false);
      setName('');
      setEmail('');
      setMobile('');
      setStatus('Active');
      setCreateCustomEngagement(false);
      setEngageName('');
      setSelectedWorkType('');
      setEngageDueDate('');
      setEngageStatus('unassigned');
      setEngageBillable(true);
      setEngageStaff([]);
    } catch (err) {
      console.error(err);
      setErrorMsg(err.data?.message || err.message || "Failed to create client.");
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editName) {
      setErrorMsg("Please fill in all mandatory fields.");
      return;
    }

    try {
      setErrorMsg("");
      await updateClient({
        id: editingClient._id,
        name: editName,
        email: editEmail,
        mobile: editMobile,
        status: editStatus
      }).unwrap();
      setEditingClient(null);
    } catch (err) {
      console.error(err);
      setErrorMsg(err.data?.message || err.message || "Failed to update client.");
    }
  };

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
      const nameKey = Object.keys(row).find(k => ['name', 'client name', 'clientname', 'client'].includes(k.toLowerCase().trim()));
      const emailKey = Object.keys(row).find(k => ['email', 'email address', 'emailaddress'].includes(k.toLowerCase().trim()));
      const mobileKey = Object.keys(row).find(k => ['mobile', 'mobile number', 'mobilenumber', 'phone', 'phonenumber'].includes(k.toLowerCase().trim()));
      const statusKey = Object.keys(row).find(k => ['status', 'client status', 'clientstatus'].includes(k.toLowerCase().trim()));
      const engNameKey = Object.keys(row).find(k => ['engagementname', 'engagement name', 'projectname', 'project name', 'engagement'].includes(k.toLowerCase().trim().replace(/\s/g, '')));
      const engWorkTypeKey = Object.keys(row).find(k => ['engagementworktype', 'engagement work type', 'worktype', 'work type', 'type'].includes(k.toLowerCase().trim().replace(/\s/g, '')));

      const name = nameKey ? row[nameKey] : '';
      const email = emailKey ? row[emailKey] : '';
      const mobile = mobileKey ? row[mobileKey] : '';
      const status = statusKey ? row[statusKey] : 'Active';
      const engagementName = engNameKey ? row[engNameKey] : '';
      const engagementWorkType = engWorkTypeKey ? row[engWorkTypeKey] : '';

      if (!name) {
        errors.push(`Row ${idx + 1}: Client Name is missing.`);
      }

      validated.push({
        name,
        email,
        mobile,
        status: status || 'Active',
        engagementName,
        engagementWorkType
      });
    });

    setBulkErrors(errors);
    setBulkData(validated);
  };

  const handleDownloadTemplate = () => {
    const csvContent = "data:text/csv;charset=utf-8," 
      + "Client Name,Email Address,Mobile Number,Status,Engagement Name,Engagement Work Type\n"
      + "Acme Corporation,contact@acme.com,+1-555-0100,Active,Acme Audit Q3,Consultation\n"
      + "Global Industries,info@global.com,,Active,Tax Planning,Taxation\n";
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "clients_bulk_upload_template.csv");
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
      const validRows = bulkData.filter(r => r.name);
      if (validRows.length === 0) {
        alert("No valid rows to upload.");
        return;
      }

      const res = await bulkAddClients(validRows).unwrap();
      setBulkLog(res);
      setBulkFile(null);
      setBulkData([]);
      setBulkErrors([]);
    } catch (err) {
      console.error(err);
      alert(err.data?.message || err.message || "Failed to upload bulk clients");
    }
  };

  return (
    <div>
      {/* Header Controls */}
      <div className="glass-panel section-card" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Building size={24} style={{ color: 'var(--accent-primary)' }} />
            <h2 style={{ fontSize: '1.25rem', margin: 0 }}>Corporate Clients Directory</h2>
          </div>
          {(currentUser?.role === 'manager' || currentUser?.role === 'admin') && (
            <div style={{ display: 'flex', gap: '8px' }}>
              <button 
                className="btn btn-secondary" 
                style={{ height: '40px', padding: '0 16px', display: 'flex', alignItems: 'center', gap: '6px' }}
                onClick={() => {
                  setBulkFile(null);
                  setBulkData([]);
                  setBulkErrors([]);
                  setBulkLog(null);
                  setShowBulkModal(true);
                }}
              >
                <Upload size={18} />
                Bulk Upload
              </button>
              <button 
                className="btn btn-primary" 
                style={{ height: '40px', padding: '0 16px', display: 'flex', alignItems: 'center', gap: '6px' }}
                onClick={() => setShowModal(true)}
              >
                <Plus size={18} />
                Add Client
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Client List */}
      <div className="glass-panel section-card">
        <div className="section-header">
          <h3>Active Clients ({clients?.length || 0})</h3>
        </div>

        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Client Company</th>
                <th>Contact Profile</th>
                <th>Active Engagements</th>
                <th>Status</th>
                {(currentUser?.role === 'manager' || currentUser?.role === 'admin') && <th style={{ textAlign: 'right' }}>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={(currentUser?.role === 'manager' || currentUser?.role === 'admin') ? 5 : 4} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-secondary)' }}>
                    Loading corporate clients...
                  </td>
                </tr>
              ) : isError ? (
                <tr>
                  <td colSpan={(currentUser?.role === 'manager' || currentUser?.role === 'admin') ? 5 : 4} style={{ textAlign: 'center', padding: '32px', color: 'var(--danger)', fontWeight: 600 }}>
                    Failed to load corporate clients.
                  </td>
                </tr>
              ) : !clients || clients.length === 0 ? (
                <tr>
                  <td colSpan={(currentUser?.role === 'manager' || currentUser?.role === 'admin') ? 5 : 4} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-secondary)' }}>
                    No corporate clients registered in the database.
                  </td>
                </tr>
              ) : (
                clients.map((client) => (
                  <tr key={client._id}>
                    <td style={{ fontWeight: 600 }}>{client.name}</td>
                    <td>
                      <div>{client.email}</div>
                      {client.mobile && <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '2px' }}>{client.mobile}</div>}
                    </td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        {!client.engagements || client.engagements.length === 0 ? (
                          <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>No active engagements</span>
                        ) : (
                          client.engagements.map(eng => (
                            <div key={eng._id} style={{ fontSize: '0.85rem' }}>
                              • {eng.name} {eng.workType && <span style={{ color: 'var(--text-muted)' }}>({eng.workType})</span>}
                            </div>
                          ))
                        )}
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${client.status === 'Active' || client.status === 'active' ? 'badge-approved' : 'badge-draft'}`}>
                        {client.status || 'Active'}
                      </span>
                    </td>
                    {(currentUser?.role === 'manager' || currentUser?.role === 'admin') && (
                      <td style={{ textAlign: 'right' }}>
                        <button
                          onClick={() => {
                            setEditingClient(client);
                            setEditName(client.name);
                            setEditEmail(client.email);
                            setEditMobile(client.mobile || '');
                            setEditStatus(client.status || 'Active');
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

      {/* Create Client Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="glass-panel modal-content" style={{ maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="modal-header">
              <h3>Create Client Account</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>Close</button>
            </div>
            
            <form onSubmit={handleSubmit}>
              {errorMsg && (
                <p className="stat-desc" style={{ color: 'var(--danger)', marginBottom: '16px', fontWeight: 600 }}>
                  {errorMsg}
                </p>
              )}

              <div className="form-group">
                <label>Name</label>
                <input 
                  type="text" 
                  className="form-control" 
                  required 
                  placeholder="e.g. Acme Corp" 
                  value={name} 
                  onChange={(e) => setName(e.target.value)} 
                />
              </div>

              <div className="form-group">
                <label>Email Address</label>
                <input 
                  type="email" 
                  className="form-control" 
                  // required 
                  placeholder="e.g. contact@acme.com" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                />
              </div>

              <div className="form-group">
                <label>Mobile Number</label>
                <input 
                  type="text" 
                  className="form-control" 
                  placeholder="e.g. +1-555-0199" 
                  value={mobile} 
                  onChange={(e) => setMobile(e.target.value)} 
                />
              </div>

              <div className="form-group">
                <label>Lifecycle Status</label>
                <select 
                  className="form-control"
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>

              {/* Toggle for Custom Engagement */}
              <div className="form-group" style={{ flexDirection: 'row', gap: '8px', alignItems: 'center', margin: '16px 0 8px 0' }}>
                <input 
                  type="checkbox"
                  id="createCustomEngagement"
                  checked={createCustomEngagement}
                  onChange={(e) => setCreateCustomEngagement(e.target.checked)}
                  style={{ width: '18px', height: '18px' }}
                />
                <label htmlFor="createCustomEngagement" style={{ cursor: 'pointer', marginBottom: 0, fontWeight: 600 }}>Also Create Engagement</label>
              </div>

              {createCustomEngagement && (
                <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '16px', marginTop: '16px' }}>
                  <h4 style={{ marginBottom: '16px', color: 'var(--accent-primary)', fontSize: '1rem' }}>Engagement</h4>

                  <div className="form-group">
                    <label>Engagement Name</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      required 
                      placeholder="e.g. Audit & Assurance Q3" 
                      value={engageName} 
                      onChange={(e) => setEngageName(e.target.value)} 
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
                        const isSelected = selectedWorkType === w.name;
                        return (
                          <button
                            key={w._id}
                            type="button"
                            onClick={() => setSelectedWorkType(w.name)}
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
                      id="engageBillable"
                      checked={engageBillable}
                      onChange={(e) => setEngageBillable(e.target.checked)}
                      style={{ width: '16px', height: '16px' }}
                    />
                    <label htmlFor="engageBillable" style={{ cursor: 'pointer', marginBottom: 0 }}>This is a billable project scope</label>
                  </div>

                  <div className="form-group">
                    <label>Assign Delivery Staff (Select multiple)</label>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', maxHeight: '120px', overflowY: 'auto', border: '1px solid var(--border-color)', padding: '10px', borderRadius: '8px', background: 'var(--bg-tertiary)' }}>
                      {empsLoading ? (
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>Loading staff members...</p>
                      ) : employees && employees.filter(e => e.role === 'staff').length === 0 ? (
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>No staff members available.</p>
                      ) : (
                        employees && employees.filter(e => e.role === 'staff').map(emp => (
                          <div key={emp._id} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            <input 
                              type="checkbox"
                              id={`emp-${emp._id}`}
                              checked={engageStaff.includes(emp._id)}
                              onChange={() => handleStaffToggle(emp._id)}
                              style={{ width: '14px', height: '14px' }}
                            />
                            <label htmlFor={`emp-${emp._id}`} style={{ cursor: 'pointer', fontSize: '0.8rem', marginBottom: 0 }}>{emp.name}</label>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                  {isSubmitting ? 'Creating...' : 'Create Client'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Client Modal */}
      {editingClient && (
        <div className="modal-overlay">
          <div className="glass-panel modal-content" style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <h3>Edit Client Account</h3>
              <button className="modal-close" onClick={() => setEditingClient(null)}>Close</button>
            </div>
            
            <form onSubmit={handleEditSubmit}>
              {errorMsg && (
                <p className="stat-desc" style={{ color: 'var(--danger)', marginBottom: '16px', fontWeight: 600 }}>
                  {errorMsg}
                </p>
              )}

              <div className="form-group">
                <label>Name</label>
                <input 
                  type="text" 
                  className="form-control" 
                  required 
                  placeholder="e.g. Acme Corp" 
                  value={editName} 
                  onChange={(e) => setEditName(e.target.value)} 
                />
              </div>

              <div className="form-group">
                <label>Email Address</label>
                <input 
                  type="email" 
                  className="form-control" 
                  // required 
                  placeholder="e.g. contact@acme.com" 
                  value={editEmail} 
                  onChange={(e) => setEditEmail(e.target.value)} 
                />
              </div>

              <div className="form-group">
                <label>Mobile Number</label>
                <input 
                  type="text" 
                  className="form-control" 
                  placeholder="e.g. +1-555-0199" 
                  value={editMobile} 
                  onChange={(e) => setEditMobile(e.target.value)} 
                />
              </div>

              <div className="form-group">
                <label>Lifecycle Status</label>
                <select 
                  className="form-control"
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value)}
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setEditingClient(null)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bulk Client Upload Modal */}
      {showBulkModal && (
        <div className="modal-overlay">
          <div className="glass-panel modal-content" style={{ maxWidth: '750px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="modal-header">
              <h3>Bulk Upload Corporate Clients</h3>
              <button className="modal-close" onClick={() => setShowBulkModal(false)}>Close</button>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '12px' }}>
                Upload multiple clients quickly using a CSV file. Make sure the headers map correctly. You can download the reference template below.
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
                        <th>Client Name</th>
                        <th>Email</th>
                        <th>Mobile</th>
                        <th>Status</th>
                        <th>Engagement Name</th>
                        <th>Work Type</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bulkData.map((row, i) => (
                        <tr key={i} style={{ borderBottom: '1px solid var(--border-color)' }}>
                          <td style={{ fontWeight: 600, color: row.name ? 'inherit' : 'var(--danger)' }}>
                            {row.name || '[Missing Name]'}
                          </td>
                          <td>{row.email || '-'}</td>
                          <td>{row.mobile || '-'}</td>
                          <td>{row.status}</td>
                          <td>{row.engagementName || '-'}</td>
                          <td>{row.engagementWorkType || '-'}</td>
                        </tr>
                      ))}
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
