import React, { useState, useEffect } from 'react';
import { api, getStoredUser } from '../../utils/api';
import { Briefcase, Plus, Trash2, Edit2, Check, X } from 'lucide-react';

const WorkType = () => {
  const [workTypes, setWorkTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const currentUser = getStoredUser();

  // Create Work Type Form State
  const [showModal, setShowModal] = useState(false);
  const [newTypeName, setNewTypeName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Edit Inline State
  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState("");

  const fetchWorkTypes = async () => {
    try {
      setLoading(true);
      setError(false);
      const data = await api.get('/workType');
      setWorkTypes(data);
    } catch (err) {
      console.error(err);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkTypes();
  }, []);

  const handleAddWorkType = async (e) => {
    e.preventDefault();
    if (!newTypeName.trim()) {
      setErrorMsg("Work type name is required.");
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMsg("");
      const data = await api.post('/workType', { name: newTypeName.trim() });
      setWorkTypes([...workTypes, data]);
      setNewTypeName("");
      setShowModal(false);
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message || "Failed to create work type.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteWorkType = async (id) => {
    if (window.confirm("Are you sure you want to delete this work type?")) {
      try {
        await api.delete(`/workType/${id}`);
        setWorkTypes(workTypes.filter(w => w._id !== id));
      } catch (err) {
        console.error(err);
        alert(`Error deleting work type: ${err.message || 'Unknown error'}`);
      }
    }
  };

  const startEdit = (wt) => {
    setEditingId(wt._id);
    setEditingName(wt.name);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingName("");
  };

  const handleUpdateWorkType = async (id) => {
    if (!editingName.trim()) {
      alert("Name cannot be empty.");
      return;
    }

    try {
      const updated = await api.put(`/workType/${id}`, { name: editingName.trim() });
      setWorkTypes(workTypes.map(w => w._id === id ? updated : w));
      setEditingId(null);
      setEditingName("");
    } catch (err) {
      console.error(err);
      alert(`Error updating work type: ${err.message || 'Unknown error'}`);
    }
  };

  const isManagerOrAdmin = currentUser?.role === 'manager' || currentUser?.role === 'admin';

  return (
    <div>
      {/* Header Controls */}
      <div className="glass-panel section-card" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Briefcase size={24} style={{ color: 'var(--accent-primary)' }} />
            <h2 style={{ fontSize: '1.25rem', margin: 0 }}>Work Types Administration Desk</h2>
          </div>
          {isManagerOrAdmin && (
            <button 
              className="btn btn-primary" 
              style={{ height: '40px', padding: '0 16px', display: 'flex', alignItems: 'center', gap: '6px' }}
              onClick={() => setShowModal(true)}
            >
              <Plus size={18} />
              Add Work Type
            </button>
          )}
        </div>
      </div>

      {/* Work Types Directory List */}
      <div className="glass-panel section-card">
        <div className="section-header">
          <h3>System Work Types ({workTypes?.length || 0})</h3>
        </div>

        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: '70%' }}>Work Type Name</th>
                {isManagerOrAdmin && <th style={{ textAlign: 'right', width: '30%' }}>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={isManagerOrAdmin ? 2 : 1} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-secondary)' }}>
                    Loading active work types...
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={isManagerOrAdmin ? 2 : 1} style={{ textAlign: 'center', padding: '32px', color: 'var(--danger)', fontWeight: 600 }}>
                    Failed to load work types database records.
                  </td>
                </tr>
              ) : workTypes.length === 0 ? (
                <tr>
                  <td colSpan={isManagerOrAdmin ? 2 : 1} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-secondary)' }}>
                    No work types registered in the system.
                  </td>
                </tr>
              ) : (
                workTypes.map((wt) => (
                  <tr key={wt._id}>
                    <td>
                      {editingId === wt._id ? (
                        <input
                          type="text"
                          className="form-control"
                          style={{ maxWidth: '300px', height: '36px', padding: '6px 12px' }}
                          value={editingName}
                          onChange={(e) => setEditingName(e.target.value)}
                        />
                      ) : (
                        <span style={{ fontWeight: 600 }}>{wt.name}</span>
                      )}
                    </td>
                    {isManagerOrAdmin && (
                      <td style={{ textAlign: 'right' }}>
                        {editingId === wt._id ? (
                          <div style={{ display: 'inline-flex', gap: '8px' }}>
                            <button
                              className="btn btn-primary btn-sm"
                              style={{ padding: '6px', background: 'var(--success)', borderColor: 'var(--success)', minWidth: 'auto' }}
                              onClick={() => handleUpdateWorkType(wt._id)}
                              title="Save Changes"
                            >
                              <Check size={14} />
                            </button>
                            <button
                              className="btn btn-secondary btn-sm"
                              style={{ padding: '6px', minWidth: 'auto' }}
                              onClick={cancelEdit}
                              title="Cancel"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        ) : (
                          <div style={{ display: 'inline-flex', gap: '8px' }}>
                            <button
                              className="btn btn-secondary btn-sm"
                              style={{ padding: '6px 12px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                              onClick={() => startEdit(wt)}
                              title="Edit Work Type"
                            >
                              <Edit2 size={14} />
                              Edit
                            </button>
                            <button
                              className="btn btn-danger btn-sm"
                              style={{ padding: '6px 12px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                              onClick={() => handleDeleteWorkType(wt._id)}
                              title="Delete Work Type"
                            >
                              <Trash2 size={14} />
                              Delete
                            </button>
                          </div>
                        )}
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Work Type Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="glass-panel modal-content" style={{ maxWidth: '450px' }}>
            <div className="modal-header">
              <h3>Create Work Type</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>Close</button>
            </div>

            <form onSubmit={handleAddWorkType}>
              {errorMsg && (
                <p className="stat-desc" style={{ color: 'var(--danger)', marginBottom: '16px', fontWeight: 600 }}>
                  {errorMsg}
                </p>
              )}

              <div className="form-group">
                <label>Work Type Name</label>
                <input 
                  type="text" 
                  className="form-control" 
                  required 
                  placeholder="e.g. Audit & Assurance, Tax Filing" 
                  value={newTypeName} 
                  onChange={(e) => setNewTypeName(e.target.value)} 
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                  {isSubmitting ? 'Creating...' : 'Create Work Type'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkType;