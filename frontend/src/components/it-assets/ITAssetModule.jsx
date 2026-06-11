import React, { useState, useEffect } from 'react';
import { Monitor, Cpu, Plus, Send, RefreshCw, Search, Calendar, ShieldCheck, AlertOctagon, History } from 'lucide-react';
import { api } from '../../utils/api';

export default function ITAssetModule({ user }) {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [assets, setAssets] = useState([]);
  const [configs, setConfigs] = useState([]);
  const [history, setHistory] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [dashboardData, setDashboardData] = useState(null);
  
  const [loading, setLoading] = useState(true);
  
  // Search state
  const [assetSearch, setAssetSearch] = useState('');
  const [historySearch, setHistorySearch] = useState('');

  // Modals state
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [selectedAssetForCheckout, setSelectedAssetForCheckout] = useState(null);
  const [checkoutEmployeeId, setCheckoutEmployeeId] = useState('');
  const [checkoutExpectedReturn, setCheckoutExpectedReturn] = useState('');
  const [checkoutCondition, setCheckoutCondition] = useState('');
  const [checkoutLocation, setCheckoutLocation] = useState('Deployed at Client');
  const [checkoutSubmitting, setCheckoutSubmitting] = useState(false);

  const [showCheckinModal, setShowCheckinModal] = useState(false);
  const [selectedAssetForCheckin, setSelectedAssetForCheckin] = useState(null);
  const [checkinCondition, setCheckinCondition] = useState('Good');
  const [checkinSubmitting, setCheckinSubmitting] = useState(false);

  // New hardware config form
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [configName, setConfigName] = useState('');
  const [configCpu, setConfigCpu] = useState('');
  const [configRam, setConfigRam] = useState('');
  const [configStorage, setConfigStorage] = useState('');
  const [configSubmitting, setConfigSubmitting] = useState(false);

  // New asset form
  const [showAssetModal, setShowAssetModal] = useState(false);
  const [newAssetConfigId, setNewAssetConfigId] = useState('');
  const [newAssetTag, setNewAssetTag] = useState('');
  const [newAssetSerial, setNewAssetSerial] = useState('');
  const [newAssetSubmitting, setNewAssetSubmitting] = useState(false);

  const isAdmin = user.role === 'admin';

  // Fetch functions
  const fetchDashboard = async () => {
    try {
      const data = await api.get('/assets/dashboard');
      setDashboardData(data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchAssets = async () => {
    try {
      const url = assetSearch ? `/assets?search=${encodeURIComponent(assetSearch)}` : '/assets';
      const data = await api.get(url);
      setAssets(data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchConfigs = async () => {
    try {
      const data = await api.get('/assets/configs');
      setConfigs(data);
      if (data.length > 0) setNewAssetConfigId(data[0]._id);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchHistory = async () => {
    try {
      const url = historySearch ? `/assets/history?search=${encodeURIComponent(historySearch)}` : '/assets/history';
      const data = await api.get(url);
      setHistory(data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchEmployees = async () => {
    try {
      const data = await api.get('/employees');
      setEmployees(data.filter(e => e.role === 'staff')); // only staff for checkouts
      if (data.length > 0) setCheckoutEmployeeId(data.filter(e => e.role === 'staff')[0]?._id || '');
    } catch (err) {
      console.error(err);
    }
  };

  const initData = async () => {
    setLoading(true);
    await Promise.all([
      fetchDashboard(),
      fetchAssets(),
      fetchConfigs(),
      fetchHistory(),
      fetchEmployees(),
    ]);
    setLoading(false);
  };

  useEffect(() => {
    initData();
  }, []);

  useEffect(() => {
    fetchAssets();
  }, [assetSearch]);

  useEffect(() => {
    fetchHistory();
  }, [historySearch]);

  // Actions handler
  const handleCreateConfig = async (e) => {
    e.preventDefault();
    try {
      setConfigSubmitting(true);
      await api.post('/assets/configs', {
        modelName: configName,
        cpu: configCpu,
        ram: configRam,
        storage: configStorage
      });
      fetchConfigs();
      setShowConfigModal(false);
      setConfigName('');
      setConfigCpu('');
      setConfigRam('');
      setConfigStorage('');
    } catch (err) {
      alert(`Error: ${err.message}`);
    } finally {
      setConfigSubmitting(false);
    }
  };

  const handleCreateAsset = async (e) => {
    e.preventDefault();
    try {
      setNewAssetSubmitting(true);
      await api.post('/assets', {
        configId: newAssetConfigId,
        assetTag: newAssetTag,
        serialNumber: newAssetSerial
      });
      fetchAssets();
      fetchDashboard();
      setShowAssetModal(false);
      setNewAssetTag('');
      setNewAssetSerial('');
    } catch (err) {
      alert(`Error: ${err.message}`);
    } finally {
      setNewAssetSubmitting(false);
    }
  };

  const handleCheckoutSubmit = async (e) => {
    e.preventDefault();
    try {
      setCheckoutSubmitting(true);
      await api.post('/assets/checkout', {
        assetId: selectedAssetForCheckout._id,
        employeeId: checkoutEmployeeId,
        expectedReturnDate: checkoutExpectedReturn,
        checkoutCondition,
        deploymentLocation: checkoutLocation
      });
      fetchAssets();
      fetchDashboard();
      fetchHistory();
      setShowCheckoutModal(false);
      setSelectedAssetForCheckout(null);
      setCheckoutCondition('');
      setCheckoutExpectedReturn('');
    } catch (err) {
      alert(`Error: ${err.message}`);
    } finally {
      setCheckoutSubmitting(false);
    }
  };

  const handleCheckinSubmit = async (e) => {
    e.preventDefault();
    try {
      setCheckinSubmitting(true);
      await api.post('/assets/checkin', {
        assetId: selectedAssetForCheckin._id,
        returnCondition: checkinCondition
      });
      fetchAssets();
      fetchDashboard();
      fetchHistory();
      setShowCheckinModal(false);
      setSelectedAssetForCheckin(null);
      setCheckinCondition('Good');
    } catch (err) {
      alert(`Error: ${err.message}`);
    } finally {
      setCheckinSubmitting(false);
    }
  };

  if (loading) {
    return <p className="stat-desc" style={{ textAlign: 'center', padding: '32px' }}>Loading Asset Manager...</p>;
  }

  // STAFF ONLY VIEW
  if (user.role === 'staff') {
    const myAssets = assets.filter(a => a.currentUserId?._id === user._id);
    const overdueMovements = dashboardData?.overdue.filter(m => m.employeeId?._id === user._id) || [];

    return (
      <div>
        {overdueMovements.length > 0 && (
          <div className="alert-card animate-pulse">
            <AlertOctagon size={24} className="alert-card-icon" />
            <div className="alert-card-content">
              <h4>URGENT: Overdue IT Assets Flagged</h4>
              <p>
                You have {overdueMovements.length} device(s) that have passed their expected return date. 
                Please schedule a return check-in with IT administration immediately.
              </p>
            </div>
          </div>
        )}

        <div className="glass-panel section-card">
          <div className="section-header">
            <h3>
              <Monitor size={20} />
              My Issued Hardware Inventory
            </h3>
          </div>

          {myAssets.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 24px', color: 'var(--text-secondary)' }}>
              <Monitor size={48} style={{ opacity: 0.3, marginBottom: '16px' }} />
              <p>No corporate devices currently assigned to you.</p>
            </div>
          ) : (
            <div className="table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Asset Tag</th>
                    <th>Model</th>
                    <th>Specifications</th>
                    <th>Serial Number</th>
                    <th>Allocation Status</th>
                  </tr>
                </thead>
                <tbody>
                  {myAssets.map((asset) => {
                    const isOverdue = dashboardData?.overdue.some(o => o.assetId?._id === asset._id);
                    return (
                      <tr key={asset._id}>
                        <td style={{ fontWeight: 600 }}>{asset.assetTag}</td>
                        <td>{asset.configId?.modelName}</td>
                        <td style={{ color: 'var(--text-secondary)' }}>
                          {asset.configId?.cpu} / {asset.configId?.ram} RAM / {asset.configId?.storage}
                        </td>
                        <td>{asset.serialNumber}</td>
                        <td>
                          <span className={`badge ${isOverdue ? 'badge-rejected' : 'badge-success'}`}>
                            {isOverdue ? 'Overdue Return' : asset.status}
                          </span>
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
  }

  // ADMIN AND MANAGER TABS VIEW
  return (
    <div>
      {/* Tab select */}
      <div className="tabs-container">
        <button className={`tab-btn ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveTab('dashboard')}>
          Dashboard & Alerts
        </button>
        <button className={`tab-btn ${activeTab === 'inventory' ? 'active' : ''}`} onClick={() => setActiveTab('inventory')}>
          Inventory Stock
        </button>
        {isAdmin && (
          <button className={`tab-btn ${activeTab === 'configs' ? 'active' : ''}`} onClick={() => setActiveTab('configs')}>
            Hardware Catalog
          </button>
        )}
        <button className={`tab-btn ${activeTab === 'history' ? 'active' : ''}`} onClick={() => setActiveTab('history')}>
          Asset History Logs
        </button>
      </div>

      {/* 1. DASHBOARD TAB */}
      {activeTab === 'dashboard' && (
        <div>
          {/* Summary */}
          <div className="dashboard-grid">
            <div className="glass-panel stat-card">
              <div className="stat-content">
                <span className="stat-title">Total Corporate Devices</span>
                <span className="stat-value">{dashboardData?.summary.total}</span>
              </div>
              <div className="stat-icon primary">
                <Monitor size={24} />
              </div>
            </div>
            <div className="glass-panel stat-card">
              <div className="stat-content">
                <span className="stat-title">Available in Office</span>
                <span className="stat-value">{dashboardData?.summary.inOffice}</span>
              </div>
              <div className="stat-icon success">
                <ShieldCheck size={24} />
              </div>
            </div>
            <div className="glass-panel stat-card">
              <div className="stat-content">
                <span className="stat-title">Deployed at Client Sites</span>
                <span className="stat-value">{dashboardData?.summary.deployed}</span>
              </div>
              <div className="stat-icon primary">
                <Send size={24} />
              </div>
            </div>
            <div className="glass-panel stat-card">
              <div className="stat-content">
                <span className="stat-title">Overdue Returns</span>
                <span className="stat-value" style={{ color: dashboardData?.overdue.length > 0 ? 'var(--danger)' : 'var(--text-primary)' }}>
                  {dashboardData?.overdue.length}
                </span>
              </div>
              <div className="stat-icon danger">
                <AlertOctagon size={24} />
              </div>
            </div>
          </div>

          {/* Overdue Warning list */}
          {dashboardData?.overdue.length > 0 && (
            <div className="alert-card">
              <AlertOctagon size={24} className="alert-card-icon" />
              <div className="alert-card-content" style={{ width: '100%' }}>
                <h4 style={{ marginBottom: '12px' }}>Overdue Asset Alert (Immediate Action Required)</h4>
                <div className="table-wrapper">
                  <table className="data-table" style={{ width: '100%' }}>
                    <thead>
                      <tr>
                        <th>Asset Tag</th>
                        <th>Device Model</th>
                        <th>Staff Member</th>
                        <th>Expected Return Date</th>
                        <th>Current Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dashboardData.overdue.map((movement) => (
                        <tr key={movement._id}>
                          <td style={{ color: 'var(--danger)', fontWeight: 600 }}>{movement.assetId?.assetTag}</td>
                          <td>{movement.assetId?.configId?.modelName}</td>
                          <td>{movement.employeeId?.name} ({movement.employeeId?.email})</td>
                          <td style={{ fontWeight: 600 }}>{new Date(movement.expectedReturnDate).toLocaleDateString()}</td>
                          <td>
                            <span className="badge badge-rejected animate-pulse">Overdue</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Static help card */}
          <div className="glass-panel section-card">
            <div className="section-header">
              <h3>System Information</h3>
            </div>
            <p className="stat-desc" style={{ fontSize: '0.95rem', lineHeight: '1.6' }}>
              The IT Asset Management module allows the workspace administrators to maintain configurations,
              provision device distributions, flag delayed laptop returns, and monitor checkout logs chronological histories.
              To configure new items, use the **Hardware Catalog** tab. To issue a checkout or process a return, proceed to the **Inventory Stock** tab.
            </p>
          </div>
        </div>
      )}

      {/* 2. INVENTORY TAB */}
      {activeTab === 'inventory' && (
        <div className="glass-panel section-card">
          <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
            <h3 style={{ marginBottom: 0 }}>
              <Monitor size={20} />
              Inventory Stock Records
            </h3>
            <div style={{ display: 'flex', gap: '12px' }}>
              <div style={{ position: 'relative' }}>
                <input 
                  type="text" 
                  className="form-control" 
                  placeholder="Search assets..." 
                  value={assetSearch}
                  onChange={(e) => setAssetSearch(e.target.value)}
                  style={{ paddingLeft: '36px', height: '40px', paddingRight: '12px', width: '220px' }}
                />
                <Search size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-muted)' }} />
              </div>
              {isAdmin && (
                <button onClick={() => setShowAssetModal(true)} className="btn btn-primary btn-sm">
                  <Plus size={16} />
                  Add Physical Asset
                </button>
              )}
            </div>
          </div>

          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Asset Tag</th>
                  <th>Model</th>
                  <th>Specs</th>
                  <th>Serial Number</th>
                  <th>Status</th>
                  <th>Assigned User</th>
                  {isAdmin && <th style={{ textAlign: 'right' }}>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {assets.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '24px', color: 'var(--text-secondary)' }}>
                      No hardware matching criteria.
                    </td>
                  </tr>
                ) : (
                  assets.map((asset) => {
                    const isOverdue = dashboardData?.overdue.some(o => o.assetId?._id === asset._id);
                    return (
                      <tr key={asset._id}>
                        <td style={{ fontWeight: 600 }}>{asset.assetTag}</td>
                        <td>{asset.configId?.modelName}</td>
                        <td style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                          {asset.configId?.cpu} / {asset.configId?.ram} / {asset.configId?.storage}
                        </td>
                        <td>{asset.serialNumber}</td>
                        <td>
                          <span className={`badge ${
                            asset.status === 'In Office' ? 'badge-success' : 
                            isOverdue ? 'badge-rejected' : 'badge-submitted'
                          }`}>
                            {isOverdue ? 'Overdue Return' : asset.status}
                          </span>
                        </td>
                        <td>{asset.currentUserId ? asset.currentUserId.name : <span style={{ color: 'var(--text-muted)' }}>None (In Stock)</span>}</td>
                        {isAdmin && (
                          <td style={{ textAlign: 'right' }}>
                            {asset.currentUserId ? (
                              <button 
                                onClick={() => {
                                  setSelectedAssetForCheckin(asset);
                                  setShowCheckinModal(true);
                                }} 
                                className="btn btn-secondary btn-sm"
                                style={{ padding: '6px 12px' }}
                              >
                                Check-in
                              </button>
                            ) : (
                              <button 
                                onClick={() => {
                                  setSelectedAssetForCheckout(asset);
                                  setShowCheckoutModal(true);
                                }} 
                                className="btn btn-primary btn-sm"
                                style={{ padding: '6px 12px' }}
                              >
                                Checkout
                              </button>
                            )}
                          </td>
                        )}
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 3. HARDWARE CONFIGS TAB */}
      {activeTab === 'configs' && isAdmin && (
        <div className="glass-panel section-card">
          <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3>
              <Cpu size={20} />
              Hardware Catalog Master
            </h3>
            <button onClick={() => setShowConfigModal(true)} className="btn btn-primary btn-sm">
              <Plus size={16} />
              Create Configuration
            </button>
          </div>

          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Model Name</th>
                  <th>Processor (CPU)</th>
                  <th>Memory (RAM)</th>
                  <th>Hard Drive (Storage)</th>
                </tr>
              </thead>
              <tbody>
                {configs.length === 0 ? (
                  <tr>
                    <td colSpan={4} style={{ textAlign: 'center', padding: '24px', color: 'var(--text-secondary)' }}>
                      No configurations set.
                    </td>
                  </tr>
                ) : (
                  configs.map((config) => (
                    <tr key={config._id}>
                      <td style={{ fontWeight: 600 }}>{config.modelName}</td>
                      <td>{config.cpu}</td>
                      <td>{config.ram}</td>
                      <td>{config.storage}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4. HISTORY TAB */}
      {activeTab === 'history' && (
        <div className="glass-panel section-card">
          <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
            <h3 style={{ marginBottom: 0 }}>
              <History size={20} />
              Asset Audit Movements Logs
            </h3>
            <div style={{ position: 'relative' }}>
              <input 
                type="text" 
                className="form-control" 
                placeholder="Search history (Tag, Staff)..." 
                value={historySearch}
                onChange={(e) => setHistorySearch(e.target.value)}
                style={{ paddingLeft: '36px', height: '40px', paddingRight: '12px', width: '250px' }}
              />
              <Search size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-muted)' }} />
            </div>
          </div>

          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Asset</th>
                  <th>Employee</th>
                  <th>Checkout Date</th>
                  <th>Expected Return</th>
                  <th>Actual Return</th>
                  <th>Condition Details</th>
                </tr>
              </thead>
              <tbody>
                {history.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '24px', color: 'var(--text-secondary)' }}>
                      No movement history logged yet.
                    </td>
                  </tr>
                ) : (
                  history.map((log) => (
                    <tr key={log._id}>
                      <td>
                        <div style={{ fontWeight: 600 }}>{log.assetId?.assetTag}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{log.assetId?.configId?.modelName}</div>
                      </td>
                      <td>{log.employeeId?.name}</td>
                      <td>{new Date(log.checkoutDate).toLocaleDateString()}</td>
                      <td>{new Date(log.expectedReturnDate).toLocaleDateString()}</td>
                      <td>
                        {log.actualReturnDate ? (
                          new Date(log.actualReturnDate).toLocaleDateString()
                        ) : (
                          <span className="badge badge-submitted">In Possession</span>
                        )}
                      </td>
                      <td style={{ fontSize: '0.85rem' }}>
                        <div><strong>Out:</strong> {log.checkoutCondition}</div>
                        {log.actualReturnDate && <div><strong>In:</strong> {log.returnCondition}</div>}
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
          MODALS
          ======================================================== */}

      {/* Create Config Modal */}
      {showConfigModal && (
        <div className="modal-overlay">
          <div className="glass-panel modal-content">
            <div className="modal-header">
              <h3>Create Hardware Configuration</h3>
              <button className="modal-close" onClick={() => setShowConfigModal(false)}>Close</button>
            </div>
            <form onSubmit={handleCreateConfig}>
              <div className="form-group">
                <label>Model Name</label>
                <input type="text" className="form-control" required placeholder="e.g. MacBook Pro M3" value={configName} onChange={(e) => setConfigName(e.target.value)} />
              </div>
              <div className="form-group">
                <label>Processor (CPU)</label>
                <input type="text" className="form-control" required placeholder="e.g. M3 Pro 12-Core" value={configCpu} onChange={(e) => setConfigCpu(e.target.value)} />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>RAM Memory</label>
                  <input type="text" className="form-control" required placeholder="e.g. 18GB" value={configRam} onChange={(e) => setConfigRam(e.target.value)} />
                </div>
                <div className="form-group">
                  <label>Storage Size</label>
                  <input type="text" className="form-control" required placeholder="e.g. 512GB SSD" value={configStorage} onChange={(e) => setConfigStorage(e.target.value)} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '16px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowConfigModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={configSubmitting}>
                  {configSubmitting ? 'Saving...' : 'Save Configuration'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Asset Modal */}
      {showAssetModal && (
        <div className="modal-overlay">
          <div className="glass-panel modal-content">
            <div className="modal-header">
              <h3>Add Physical Asset to Stock</h3>
              <button className="modal-close" onClick={() => setShowAssetModal(false)}>Close</button>
            </div>
            <form onSubmit={handleCreateAsset}>
              <div className="form-group">
                <label>Select Model Configuration</label>
                <select className="form-control" value={newAssetConfigId} onChange={(e) => setNewAssetConfigId(e.target.value)}>
                  {configs.map(c => (
                    <option key={c._id} value={c._id}>{c.modelName} ({c.cpu} / {c.ram})</option>
                  ))}
                </select>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Asset Tag ID</label>
                  <input type="text" className="form-control" required placeholder="e.g. AST-004" value={newAssetTag} onChange={(e) => setNewAssetTag(e.target.value)} />
                </div>
                <div className="form-group">
                  <label>Serial Number</label>
                  <input type="text" className="form-control" required placeholder="e.g. S/N-M3P004" value={newAssetSerial} onChange={(e) => setNewAssetSerial(e.target.value)} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '16px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowAssetModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={newAssetSubmitting}>
                  {newAssetSubmitting ? 'Registering...' : 'Register Asset'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Checkout Modal */}
      {showCheckoutModal && (
        <div className="modal-overlay">
          <div className="glass-panel modal-content">
            <div className="modal-header">
              <h3>Checkout Asset: {selectedAssetForCheckout?.assetTag}</h3>
              <button className="modal-close" onClick={() => {
                setShowCheckoutModal(false);
                setSelectedAssetForCheckout(null);
              }}>Close</button>
            </div>
            <form onSubmit={handleCheckoutSubmit}>
              <div className="form-group">
                <label>Deploy To Employee</label>
                <select className="form-control" value={checkoutEmployeeId} onChange={(e) => setCheckoutEmployeeId(e.target.value)}>
                  {employees.map(e => (
                    <option key={e._id} value={e._id}>{e.name} ({e.email})</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Expected Return Date</label>
                <input type="date" className="form-control" required value={checkoutExpectedReturn} onChange={(e) => setCheckoutExpectedReturn(e.target.value)} />
              </div>
              <div className="form-group">
                <label>Checkout Condition Notes</label>
                <input type="text" className="form-control" required placeholder="e.g. Good condition, brand new bag" value={checkoutCondition} onChange={(e) => setCheckoutCondition(e.target.value)} />
              </div>
              <div className="form-group">
                <label>Deployment Location</label>
                <select className="form-control" value={checkoutLocation} onChange={(e) => setCheckoutLocation(e.target.value)}>
                  <option value="Deployed at Client">Deployed at Client Site</option>
                  <option value="In Office">Used in Office</option>
                </select>
              </div>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '16px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => {
                  setShowCheckoutModal(false);
                  setSelectedAssetForCheckout(null);
                }}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={checkoutSubmitting}>
                  {checkoutSubmitting ? 'Deploying...' : 'Deploy Device'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Checkin Modal */}
      {showCheckinModal && (
        <div className="modal-overlay">
          <div className="glass-panel modal-content">
            <div className="modal-header">
              <h3>Check-in Asset Return: {selectedAssetForCheckin?.assetTag}</h3>
              <button className="modal-close" onClick={() => {
                setShowCheckinModal(false);
                setSelectedAssetForCheckin(null);
              }}>Close</button>
            </div>
            <form onSubmit={handleCheckinSubmit}>
              <div className="form-group">
                <label>Return Condition Notes</label>
                <input type="text" className="form-control" required placeholder="e.g. Good condition, minor scratch on bottom" value={checkinCondition} onChange={(e) => setCheckinCondition(e.target.value)} />
              </div>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '16px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => {
                  setShowCheckinModal(false);
                  setSelectedAssetForCheckin(null);
                }}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={checkinSubmitting}>
                  {checkinSubmitting ? 'Receiving...' : 'Process Return'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
