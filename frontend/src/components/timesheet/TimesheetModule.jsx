import React, { useState, useEffect, useRef } from 'react';
import { Calendar, Clock, Check, Plus, MessageSquare, AlertCircle, CheckCircle, XCircle, Send, LayoutGrid, List } from 'lucide-react';
import { api } from '../../utils/api';

export default function TimesheetModule({ user, initialTab }) {
  const [activeTab, setActiveTab] = useState(initialTab || 'entries');

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);
  const [timesheets, setTimesheets] = useState([]);
  const [engagements, setEngagements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [workTypes, setWorkTypes] = useState([]);

  // Form states
  const [selectedEngage, setSelectedEngage] = useState('');
  const [workType, setWorkType] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [hours, setHours] = useState('');
  const [markedDone, setMarkedDone] = useState(false);
  const [logging, setLogging] = useState(false);

  // Bulk Entry grid states
  const [bulkDate, setBulkDate] = useState(new Date().toISOString().split('T')[0]);
  const [bulkHours, setBulkHours] = useState({}); // { [engageId]: hours }
  const [bulkWorkTypes, setBulkWorkTypes] = useState({}); // { [engageId]: workType }
  const [bulkDone, setBulkDone] = useState({}); // { [engageId]: boolean }
  const [bulkSaving, setBulkSaving] = useState(false);

  // Manager Approvals state
  const [pendingApprovals, setPendingApprovals] = useState([]);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectId, setRejectId] = useState(null);
  const [rejectComment, setRejectComment] = useState('');
  const [rejectSubmitting, setRejectSubmitting] = useState(false);

  // Raise query state
  const [showQueryModal, setShowQueryModal] = useState(false);
  const [queryTSId, setQueryTSId] = useState(null);
  const [queryComment, setQueryComment] = useState('');
  const [querySubmitting, setQuerySubmitting] = useState(false);

  // Chat queries state
  const [activeQueryTS, setActiveQueryTS] = useState(null); // timesheet object
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef(null);

  // Edit / Rework state
  const [editingTS, setEditingTS] = useState(null);
  const [editHours, setEditHours] = useState('');
  const [editWorkType, setEditWorkType] = useState('');
  const [editEngagementId, setEditEngagementId] = useState('');
  const [editMarkedDone, setEditMarkedDone] = useState(false);

  const isSupervisor = user.role === 'manager' || user.role === 'admin';

  const fetchTimesheets = async () => {
    try {
      const data = await api.get('/timesheets');
      setTimesheets(data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchEngagements = async () => {
    try {
      const data = await api.get('/engagements');
      setEngagements(data);
      
      const filtered = data.filter(e => {
        if (user.role === 'staff') {
          return e.assignedStaff?.some(s => (typeof s === 'object' ? s._id : s) === user._id);
        }
        return true;
      });

      if (filtered.length > 0) {
        setSelectedEngage(filtered[0]._id);
        setWorkType(filtered[0].workType || '');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const filteredEngagements = engagements.filter(e => {
    if (user.role === 'staff') {
      return e.assignedStaff?.some(s => {
        const id = typeof s === 'object' ? s._id : s;
        return id === user._id;
      });
    }
    return true;
  });

  const selectedEngagement = filteredEngagements.find(e => e._id === selectedEngage);

  const handleEngagementChange = (engageId) => {
    setSelectedEngage(engageId);
    const selected = filteredEngagements.find(e => e._id === engageId);
    if (selected) {
      setWorkType(selected.workType || '');
    }
  };

  const selectedEditEngagement = filteredEngagements.find(e => e._id === editEngagementId);

  const handleEditEngagementChange = (engageId) => {
    setEditEngagementId(engageId);
    const selected = filteredEngagements.find(e => e._id === engageId);
    if (selected) {
      setEditWorkType(selected.workType || '');
    }
  };

  const fetchPendingApprovals = async () => {
    if (!isSupervisor) return;
    try {
      const data = await api.get('/timesheets?pendingOnly=true');
      setPendingApprovals(data);
    } catch (err) {
      console.error(err);
    }
  };

  const initData = async () => {
    setLoading(true);
    await Promise.all([
      fetchTimesheets(),
      fetchEngagements(),
      fetchPendingApprovals()
    ]);
    setLoading(false);
  };

  useEffect(() => {
    initData();
  }, []);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (activeQueryTS) {
      scrollToBottom();
    }
  }, [messages, activeQueryTS]);

  useEffect(() => {
    if (!activeQueryTS) return;

    const pollMessages = async () => {
      try {
        const data = await api.get(`/timesheets/${activeQueryTS._id}/queries`);
        setMessages(data);
      } catch (err) {
        console.error('Failed to poll chat messages:', err);
      }
    };

    const interval = setInterval(pollMessages, 3000);
    return () => clearInterval(interval);
  }, [activeQueryTS]);

  // Submit Single Row
  const handleLogHours = async (e) => {
    e.preventDefault();
    if (!selectedEngage) return;
    try {
      setLogging(true);
      await api.post('/timesheets', {
        engagementId: selectedEngage,
        workType,
        date,
        hours: parseFloat(hours),
        markedDone
      });
      setHours('');
      setMarkedDone(false);
      await Promise.all([fetchTimesheets(), fetchEngagements()]);
    } catch (err) {
      alert(`Error: ${err.message}`);
    } finally {
      setLogging(false);
    }
  };

  const handleBulkSubmit = async (e) => {
    e.preventDefault();
    const entries = [];
    
    filteredEngagements.forEach(engage => {
      const hoursLogged = parseFloat(bulkHours[engage._id]);
      if (hoursLogged > 0) {
        entries.push({
          engagementId: engage._id,
          workType: bulkWorkTypes[engage._id] || engage.workType || 'Audit Work',
          hours: hoursLogged,
          markedDone: !!bulkDone[engage._id]
        });
      }
    });

    if (entries.length === 0) {
      alert('Please input hours for at least one engagement.');
      return;
    }

    try {
      setBulkSaving(true);
      await api.post('/timesheets/bulk', {
        date: bulkDate,
        entries
      });
      
      // Clear inputs
      setBulkHours({});
      setBulkDone({});
      
      await Promise.all([fetchTimesheets(), fetchEngagements()]);
      setActiveTab('entries');
      alert(`Successfully logged ${entries.length} timesheet entries.`);
    } catch (err) {
      alert(`Error: ${err.message}`);
    } finally {
      setBulkSaving(false);
    }
  };

  // Submit Drafts
  const handleSubmitDrafts = async () => {
    try {
      await api.put('/timesheets/submit-drafts');
      fetchTimesheets();
      fetchPendingApprovals();
      alert('Draft timesheets submitted successfully.');
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
  };

  // Manager Approve
  const handleApprove = async (id) => {
    try {
      await api.put(`/timesheets/${id}/approve`);
      fetchPendingApprovals();
      fetchTimesheets();
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
  };

  // Manager Reject
  const handleRejectClick = (id) => {
    setRejectId(id);
    setRejectComment('');
    setShowRejectModal(true);
  };

  const handleRejectSubmit = async (e) => {
    e.preventDefault();
    if (!rejectComment) return;
    try {
      setRejectSubmitting(true);
      await api.put(`/timesheets/${rejectId}/reject`, {
        rejectionComment: rejectComment
      });
      setShowRejectModal(false);
      setRejectId(null);
      setRejectComment('');
      fetchPendingApprovals();
      fetchTimesheets();
    } catch (err) {
      alert(`Error: ${err.message}`);
    } finally {
      setRejectSubmitting(false);
    }
  };

  // Manager Raise Query
  const handleRaiseQueryClick = (id) => {
    setQueryTSId(id);
    setQueryComment('');
    setShowQueryModal(true);
  };

  const handleQuerySubmit = async (e) => {
    e.preventDefault();
    if (!queryComment) return;
    try {
      setQuerySubmitting(true);
      await api.put(`/timesheets/${queryTSId}/query`, {
        queryComment: queryComment
      });
      setShowQueryModal(false);
      setQueryTSId(null);
      setQueryComment('');
      fetchPendingApprovals();
      fetchTimesheets();
    } catch (err) {
      alert(`Error: ${err.message}`);
    } finally {
      setQuerySubmitting(false);
    }
  };

  // Query Chat Drawer Actions
  const handleOpenQueryChat = async (ts) => {
    setActiveQueryTS(ts);
    setChatLoading(true);
    try {
      const data = await api.get(`/timesheets/${ts._id}/queries`);
      setMessages(data);
    } catch (err) {
      console.error(err);
    } finally {
      setChatLoading(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeQueryTS) return;
    try {
      setSendingMessage(true);
      const msg = await api.post(`/timesheets/${activeQueryTS._id}/queries`, {
        message: newMessage
      });
      setMessages([...messages, msg]);
      setNewMessage('');
    } catch (err) {
      alert(err.message);
    } finally {
      setSendingMessage(false);
    }
  };

  // Edit / Rework Handler
  const handleEditClick = (ts) => {
    setEditingTS(ts);
    setEditHours(ts.hours);
    setEditWorkType(ts.workType);
    setEditEngagementId(ts.engagementId?._id || '');
    setEditMarkedDone(ts.markedDone);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/timesheets/${editingTS._id}`, {
        hours: parseFloat(editHours),
        workType: editWorkType,
        engagementId: editEngagementId,
        markedDone: editMarkedDone
      });
      setEditingTS(null);
      fetchTimesheets();
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
  };


useEffect(()=>{
  fetchWorkTypes();
},[])

const fetchWorkTypes=async()=>{
  try{
    const data = await api.get('/workType');
    if (data) {
      setWorkTypes(data);
      if (data.length > 0) {
        setWorkType(data[0].name);
      }
    }
  }
  catch(err){
    console.log(err)
  }
}

  if (loading) {
    return <p className="stat-desc" style={{ textAlign: 'center', padding: '32px' }}>Loading Timesheets...</p>;
  }

  const draftCount = timesheets.filter(t => t.status === 'draft').length;

  return (
    <div>
      {/* Tabs list */}
      <div className="tabs-container">
        <button className={`tab-btn ${activeTab === 'entries' ? 'active' : ''}`} onClick={() => setActiveTab('entries')}>
          <List size={16} style={{ marginRight: '6px', verticalAlign: 'middle', display: 'inline-block' }} />
          My Timesheet Entries
        </button>
        {user.role === 'staff' && (
          <button className={`tab-btn ${activeTab === 'bulk' ? 'active' : ''}`} onClick={() => setActiveTab('bulk')}>
            <LayoutGrid size={16} style={{ marginRight: '6px', verticalAlign: 'middle', display: 'inline-block' }} />
            Daily Bulk Entry Grid
          </button>
        )}
        {isSupervisor && (
          <button className={`tab-btn ${activeTab === 'approvals' ? 'active' : ''}`} onClick={() => setActiveTab('approvals')}>
            Pending Approvals ({pendingApprovals.filter(t => t.status === 'submitted').length})
          </button>
        )}
        {isSupervisor && (
          <button className={`tab-btn ${activeTab === 'queries' ? 'active' : ''}`} onClick={() => setActiveTab('queries')}>
            Timesheet Queries ({pendingApprovals.filter(t => t.status === 'queried').length})
          </button>
        )}
      </div>

      {/* 1. MY ENTRIES */}
      {activeTab === 'entries' && (
        <div className="dashboard-sections">
          <div className="glass-panel section-card">
            <div className="section-header">
              <h3>Timesheet Logging History</h3>
              {draftCount > 0 && user.role === 'staff' && (
                <button onClick={handleSubmitDrafts} className="btn btn-primary btn-sm">
                  <CheckCircle size={16} />
                  Submit Drafts ({draftCount})
                </button>
              )}
            </div>

            <div className="table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Engagement / Client</th>
                    <th>Work Type</th>
                    <th>Hours</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {timesheets.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ textAlign: 'center', padding: '24px', color: 'var(--text-secondary)' }}>
                        No timesheet logs created yet. Log hours on the right panel or use Bulk Entry.
                      </td>
                    </tr>
                  ) : (
                    timesheets.map((ts) => (
                      <tr key={ts._id}>
                        <td>{ts.date}</td>
                        <td>
                          <div style={{ fontWeight: 600 }}>{ts.engagementId?.name}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{ts.engagementId?.clientId?.name}</div>
                        </td>
                        <td>{ts.workType}</td>
                        <td style={{ fontWeight: 600 }}>{ts.hours} hrs</td>
                        <td>
                          <span className={`badge badge-${ts.status}`}>
                            {ts.status}
                          </span>
                          {(ts.status === 'rejected' || ts.status === 'queried') && (
                            <div style={{ fontSize: '0.75rem', color: ts.status === 'queried' ? 'var(--warning)' : 'var(--danger)', marginTop: '4px', maxWidth: '200px' }}>
                              {ts.status === 'queried' ? 'Query' : 'Reason'}: {ts.rejectionComment}
                            </div>
                          )}
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                            {(ts.status === 'rejected' || ts.status === 'queried') && (
                              <button onClick={() => handleOpenQueryChat(ts)} className="btn btn-secondary btn-sm" style={{ padding: '6px 12px', borderColor: 'var(--warning)', color: 'var(--warning)' }}>
                                <MessageSquare size={14} />
                                Query Chat
                              </button>
                            )}
                            {(ts.status === 'draft' || ts.status === 'rejected' || ts.status === 'queried') && (
                              <button onClick={() => handleEditClick(ts)} className="btn btn-secondary btn-sm" style={{ padding: '6px 12px' }}>
                                Rework
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Log single entry right sidebar panel */}
          {user.role === 'staff' && (
            <div className="glass-panel section-card">
              <div className="section-header">
                <h3>Log Single Entry</h3>
              </div>
              <form onSubmit={handleLogHours}>
                <div className="form-group">
                  <label>Client Project / Engagement</label>
                  <select className="form-control" value={selectedEngage} onChange={(e) => handleEngagementChange(e.target.value)}>
                    <option value="unassigned">Unassigned</option>
                    {filteredEngagements.map(e => (
                      <option key={e._id} value={e._id}>{e.name} ({e.clientId?.name})</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Work Type</label>
                  <select className="form-control" value={workType} onChange={(e) => setWorkType(e.target.value)}>
                    {selectedEngagement ? (
                      <option value={selectedEngagement.workType}>{selectedEngagement.workType}</option>
                    ) : (
                      <option value="">No Work Type Available</option>
                    )}
                  </select>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Log Date</label>
                    <input type="date" className="form-control" required value={date} onChange={(e) => setDate(e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label>Hours Worked</label>
                    <input type="number" className="form-control" step="0.5" min="0.5" max="24" required placeholder="e.g. 7.5" value={hours} onChange={(e) => setHours(e.target.value)} />
                  </div>
                </div>

                <div className="form-group" style={{ flexDirection: 'row', gap: '8px', alignItems: 'center', margin: '8px 0 16px 0' }}>
                  <input type="checkbox" id="mark-done" checked={markedDone} onChange={(e) => setMarkedDone(e.target.checked)} style={{ width: '18px', height: '18px' }} />
                  <label htmlFor="mark-done" style={{ cursor: 'pointer', marginBottom: 0 }}>Mark engagement as done</label>
                </div>

                <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={logging}>
                  <Plus size={18} />
                  {logging ? 'Logging Hours...' : 'Log Hours (Save Draft)'}
                </button>
              </form>
            </div>
          )}
        </div>
      )}

      {/* 2. DAILY BULK ENTRY */}
      {activeTab === 'bulk' && user.role === 'staff' && (
        <div className="glass-panel bulk-grid-card">
          <div className="section-header">
            <h3>Daily Bulk Entry Matrix</h3>
          </div>
          <form onSubmit={handleBulkSubmit}>
            <div className="bulk-date-selector">
              <div className="form-group" style={{ width: '220px', marginBottom: 0 }}>
                <label>Select Workday</label>
                <div style={{ position: 'relative' }}>
                  <input type="date" className="form-control" required value={bulkDate} onChange={(e) => setBulkDate(e.target.value)} style={{ paddingLeft: '40px' }} />
                  <Calendar size={18} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-muted)' }} />
                </div>
              </div>
              <p className="stat-desc" style={{ marginTop: '20px' }}>
                Fill in the hours for all client engagements you worked on for this day. Leave hours empty or 0 if not worked.
              </p>
            </div>

            {filteredEngagements.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '32px' }}>
                <AlertCircle size={32} style={{ color: 'var(--warning)', marginBottom: '12px' }} />
                <p>You have no active engagements assigned to your employee account.</p>
              </div>
            ) : (
              <div className="bulk-table-container">
                <table className="bulk-table">
                  <thead>
                    <tr>
                      <th style={{ width: '40%' }}>Assigned Client Engagement</th>
                      <th style={{ width: '25%' }}>Work Type</th>
                      <th style={{ width: '15%' }}>Hours</th>
                      <th style={{ width: '20%' }}>Mark Done?</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredEngagements.map((engage) => (
                      <tr key={engage._id}>
                        <td style={{ fontWeight: 600 }}>
                          <div>{engage.name}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{engage.clientId?.name}</div>
                        </td>
                        <td>
                          <select 
                            className="form-control" 
                            value={bulkWorkTypes[engage._id] || engage.workType || ''}
                            onChange={(e) => setBulkWorkTypes({
                              ...bulkWorkTypes,
                              [engage._id]: e.target.value
                            })}
                            style={{ padding: '8px 12px', fontSize: '0.875rem' }}
                          >
                            <option value={engage.workType}>{engage.workType}</option>
                          </select>
                        </td>
                        <td>
                          <input 
                            type="number" 
                            className="form-control bulk-input-hours"
                            step="0.5"
                            min="0"
                            max="24"
                            placeholder="0"
                            value={bulkHours[engage._id] || ''}
                            onChange={(e) => setBulkHours({
                              ...bulkHours,
                              [engage._id]: e.target.value
                            })}
                            style={{ padding: '8px', fontSize: '0.875rem' }}
                          />
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            <input 
                              type="checkbox" 
                              id={`done-${engage._id}`}
                              checked={!!bulkDone[engage._id]}
                              onChange={(e) => setBulkDone({
                                ...bulkDone,
                                [engage._id]: e.target.checked
                              })}
                              style={{ width: '16px', height: '16px' }}
                            />
                            <label htmlFor={`done-${engage._id}`} style={{ cursor: 'pointer', fontSize: '0.8rem', marginBottom: 0 }}>Engagement Done</label>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button type="submit" className="btn btn-primary" disabled={bulkSaving || filteredEngagements.length === 0}>
                <Clock size={18} />
                {bulkSaving ? 'Saving Bulk logs...' : 'Save Daily Bulk Entries'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 3. MANAGER PENDING APPROVALS */}
      {activeTab === 'approvals' && isSupervisor && (
        <div className="glass-panel section-card">
          <div className="section-header">
            <h3>Pending Subordinate Timesheets Review</h3>
          </div>

          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Date</th>
                  <th>Engagement / Client</th>
                  <th>Work Type</th>
                  <th>Logged Hours</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Review Choice</th>
                </tr>
              </thead>
              <tbody>
                {pendingApprovals.filter(t => t.status === 'submitted').length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '24px', color: 'var(--text-secondary)' }}>
                      No timesheets currently pending your review.
                    </td>
                  </tr>
                ) : (
                  pendingApprovals.filter(t => t.status === 'submitted').map((ts) => (
                    <tr key={ts._id}>
                      <td style={{ fontWeight: 600 }}>{ts.employeeId?.name}</td>
                      <td>{ts.date}</td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{ts.engagementId?.name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{ts.engagementId?.clientId?.name}</div>
                      </td>
                      <td>{ts.workType}</td>
                      <td style={{ fontWeight: 600 }}>{ts.hours} hrs</td>
                      <td>
                        <span className={`badge badge-${ts.status}`}>
                          {ts.status}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                          <button onClick={() => handleApprove(ts._id)} className="btn btn-primary btn-sm" style={{ padding: '6px 12px', background: 'var(--success)' }}>
                            <Check size={14} />
                            Approve
                          </button>
                          <button onClick={() => handleRaiseQueryClick(ts._id)} className="btn btn-secondary btn-sm" style={{ padding: '6px 12px', borderColor: 'var(--warning)', color: 'var(--warning)' }}>
                            <MessageSquare size={14} />
                            Raise Query
                          </button>
                          <button onClick={() => handleRejectClick(ts._id)} className="btn btn-danger btn-sm" style={{ padding: '6px 12px' }}>
                            Reject
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4. MANAGER TIMESHEET QUERIES */}
      {activeTab === 'queries' && isSupervisor && (
        <div className="glass-panel section-card">
          <div className="section-header">
            <h3>Active Timesheet Queries</h3>
          </div>

          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Date</th>
                  <th>Engagement / Client</th>
                  <th>Work Type</th>
                  <th>Logged Hours</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Review Choice</th>
                </tr>
              </thead>
              <tbody>
                {pendingApprovals.filter(t => t.status === 'queried').length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '24px', color: 'var(--text-secondary)' }}>
                      No active timesheet queries.
                    </td>
                  </tr>
                ) : (
                  pendingApprovals.filter(t => t.status === 'queried').map((ts) => (
                    <tr key={ts._id}>
                      <td style={{ fontWeight: 600 }}>{ts.employeeId?.name}</td>
                      <td>{ts.date}</td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{ts.engagementId?.name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{ts.engagementId?.clientId?.name}</div>
                      </td>
                      <td>{ts.workType}</td>
                      <td style={{ fontWeight: 600 }}>{ts.hours} hrs</td>
                      <td>
                        <span className={`badge badge-${ts.status}`}>
                          {ts.status}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                          <button onClick={() => handleApprove(ts._id)} className="btn btn-primary btn-sm" style={{ padding: '6px 12px', background: 'var(--success)' }}>
                            <Check size={14} />
                            Approve
                          </button>
                          <button onClick={() => handleOpenQueryChat(ts)} className="btn btn-secondary btn-sm" style={{ padding: '6px 12px', borderColor: 'var(--warning)', color: 'var(--warning)' }}>
                            <MessageSquare size={14} />
                            Query Chat
                          </button>
                          <button onClick={() => handleRejectClick(ts._id)} className="btn btn-danger btn-sm" style={{ padding: '6px 12px' }}>
                            Reject
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================
          MODALS & CONVERSATION DRAWER
          ======================================================== */}

      {/* Rejection comment modal */}
      {showRejectModal && (
        <div className="modal-overlay">
          <div className="glass-panel modal-content">
            <div className="modal-header">
              <h3>Timesheet Rejection Reason</h3>
              <button className="modal-close" onClick={() => {
                setShowRejectModal(false);
                setRejectId(null);
                setRejectComment('');
              }}>Close</button>
            </div>
            <form onSubmit={handleRejectSubmit}>
              <div className="form-group">
                <label>Rejection Reason Comment (Mandatory)</label>
                <textarea 
                  className="form-control" 
                  rows="4" 
                  required
                  placeholder="Detail the corrections the employee needs to make..."
                  value={rejectComment}
                  onChange={(e) => setRejectComment(e.target.value)}
                />
              </div>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '16px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => {
                  setShowRejectModal(false);
                  setRejectId(null);
                  setRejectComment('');
                }}>Cancel</button>
                <button type="submit" className="btn btn-danger" disabled={rejectSubmitting}>
                  {rejectSubmitting ? 'Rejecting...' : 'Reject Timesheet'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Raise query modal */}
      {showQueryModal && (
        <div className="modal-overlay">
          <div className="glass-panel modal-content">
            <div className="modal-header">
              <h3>Raise Timesheet Query</h3>
              <button className="modal-close" onClick={() => {
                setShowQueryModal(false);
                setQueryTSId(null);
                setQueryComment('');
              }}>Close</button>
            </div>
            <form onSubmit={handleQuerySubmit}>
              <div className="form-group">
                <label>Query / Clarification Comment (Mandatory)</label>
                <textarea 
                  className="form-control" 
                  rows="4" 
                  required
                  placeholder="Detail the questions or clarification needed from the employee..."
                  value={queryComment}
                  onChange={(e) => setQueryComment(e.target.value)}
                />
              </div>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '16px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => {
                  setShowQueryModal(false);
                  setQueryTSId(null);
                  setQueryComment('');
                }}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ background: 'var(--warning)', color: '#000000' }} disabled={querySubmitting}>
                  {querySubmitting ? 'Raising Query...' : 'Raise Query'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Query Chat Modal */}
      {activeQueryTS && (
        <div className="modal-overlay">
          <div className="glass-panel modal-content" style={{ maxWidth: '650px', padding: 0, overflow: 'hidden' }}>
            <div className="chat-container">
              <div className="chat-header">
                <div>
                  <h4 style={{ fontWeight: 600 }}>Rework Query: {activeQueryTS.engagementId?.name}</h4>
                  <p className="stat-desc" style={{ fontSize: '0.75rem' }}>
                    Logged: {activeQueryTS.date} ({activeQueryTS.hours} hrs)
                  </p>
                </div>
                <button className="modal-close" onClick={() => setActiveQueryTS(null)} style={{ fontSize: '0.9rem', fontWeight: 600 }}>
                  Exit Chat
                </button>
              </div>

              <div className="chat-history">
                {chatLoading ? (
                  <p className="stat-desc" style={{ textAlign: 'center' }}>Loading conversation history...</p>
                ) : (
                  <>
                    {messages.map((msg) => {
                      const isMe = msg.senderId?._id === user._id;
                      const isSystem = msg.message.startsWith('System Alert');
                      return (
                        <div 
                          key={msg._id} 
                          className={`chat-bubble ${isSystem ? 'system' : isMe ? 'sent' : 'received'}`}
                        >
                          {!isSystem && (
                            <span className="chat-sender-info">
                              {msg.senderId?.name} ({msg.senderId?.role})
                            </span>
                          )}
                          <span>{msg.message}</span>
                        </div>
                      );
                    })}
                    <div ref={chatEndRef} />
                  </>
                )}
              </div>

              <form onSubmit={handleSendMessage} className="chat-input-area">
                <input 
                  type="text" 
                  className="form-control chat-input" 
                  required
                  placeholder="Type your message here..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                />
                <button type="submit" className="btn btn-primary" disabled={sendingMessage}>
                  <Send size={16} />
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Rework Edit Timesheet Modal */}
      {editingTS && (
        <div className="modal-overlay">
          <div className="glass-panel modal-content">
            <div className="modal-header">
              <h3>Rework Timesheet Entry</h3>
              <button className="modal-close" onClick={() => setEditingTS(null)}>Close</button>
            </div>
            <form onSubmit={handleEditSubmit}>
              <div className="form-group">
                <label>Logged Engagement</label>
                <select className="form-control" value={editEngagementId} onChange={(e) => handleEditEngagementChange(e.target.value)}>
                  {filteredEngagements.map(e => (
                    <option key={e._id} value={e._id}>{e.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Work Type</label>
                <select className="form-control" value={editWorkType} onChange={(e) => setEditWorkType(e.target.value)}>
                  {selectedEditEngagement ? (
                    <option value={selectedEditEngagement.workType}>{selectedEditEngagement.workType}</option>
                  ) : (
                    <option value="">No Work Type Available</option>
                  )}
                </select>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Hours Worked</label>
                  <input type="number" className="form-control" step="0.5" min="0.5" max="24" required value={editHours} onChange={(e) => setEditHours(e.target.value)} />
                </div>
                <div className="form-group" style={{ flexDirection: 'row', gap: '8px', alignItems: 'center', marginTop: '30px' }}>
                  <input type="checkbox" id="edit-mark-done" checked={editMarkedDone} onChange={(e) => setEditMarkedDone(e.target.checked)} style={{ width: '18px', height: '18px' }} />
                  <label htmlFor="edit-mark-done" style={{ cursor: 'pointer', marginBottom: 0 }}>Mark engagement done</label>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setEditingTS(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Changes (Convert to Draft)</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
