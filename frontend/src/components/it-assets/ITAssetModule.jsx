import React, { useState, useEffect } from 'react';
import { RefreshCw, Monitor, AlertOctagon, CheckCircle } from 'lucide-react';
import { api } from '../../utils/api';

// Subcomponents imports
import AssetDashboard from './components/AssetDashboard';
import AssetInventory from './components/AssetInventory';
import HardwareCatalog from './components/HardwareCatalog';
import AssetHistory from './components/AssetHistory';
import AssetReports from './components/AssetReports';
import AssetDetailsSheet from './components/AssetDetailsSheet';
import { CheckoutModal, CheckinModal, ConfigModal, AssetModal } from './components/AssetModals';

export default function ITAssetModule({ user, subScreen }) {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [assets, setAssets] = useState([]);
  const [configs, setConfigs] = useState([]);
  const [history, setHistory] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Search & Filter state
  const [assetSearch, setAssetSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterDeviceType, setFilterDeviceType] = useState('');
  const [filterEmployeeId, setFilterEmployeeId] = useState('');
  const [historySearch, setHistorySearch] = useState('');

  // Selected Asset for details & timeline history
  const [selectedAssetForDetails, setSelectedAssetForDetails] = useState(null);
  const [selectedAssetHistory, setSelectedAssetHistory] = useState([]);
  const [loadingAssetHistory, setLoadingAssetHistory] = useState(false);

  // Modals state
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [selectedAssetForCheckout, setSelectedAssetForCheckout] = useState(null);
  const [checkoutEmployeeId, setCheckoutEmployeeId] = useState('');
  const [checkoutDate, setCheckoutDate] = useState(new Date().toISOString().substring(0, 10));
  const [checkoutExpectedReturn, setCheckoutExpectedReturn] = useState('');
  const [checkoutCondition, setCheckoutCondition] = useState('Excellent');
  const [checkoutLocation, setCheckoutLocation] = useState('Deployed at Client');
  const [checkoutRemarks, setCheckoutRemarks] = useState('');
  const [checkoutSubmitting, setCheckoutSubmitting] = useState(false);

  const [showCheckinModal, setShowCheckinModal] = useState(false);
  const [selectedAssetForCheckin, setSelectedAssetForCheckin] = useState(null);
  const [checkinDate, setCheckinDate] = useState(new Date().toISOString().substring(0, 10));
  const [checkinCondition, setCheckinCondition] = useState('Good');
  const [checkinRemarks, setCheckinRemarks] = useState('');
  const [checkinSubmitting, setCheckinSubmitting] = useState(false);

  // Configuration Modal state (Add / Edit)
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [editingConfig, setEditingConfig] = useState(null);
  const [configBrand, setConfigBrand] = useState('');
  const [configModel, setConfigModel] = useState('');
  const [configDeviceType, setConfigDeviceType] = useState('Laptop');
  const [configCpu, setConfigCpu] = useState('');
  const [configRam, setConfigRam] = useState('');
  const [configStorage, setConfigStorage] = useState('');
  const [configGpu, setConfigGpu] = useState('Integrated');
  const [configOs, setConfigOs] = useState('Windows 11 Pro');
  const [configWarranty, setConfigWarranty] = useState('');
  const [configSpecs, setConfigSpecs] = useState('');
  const [configSubmitting, setConfigSubmitting] = useState(false);

  // Asset Modal state (Add / Edit)
  const [showAssetModal, setShowAssetModal] = useState(false);
  const [editingAsset, setEditingAsset] = useState(null);
  const [assetConfigId, setAssetConfigId] = useState('');
  const [assetTag, setAssetTag] = useState('');
  const [assetSerial, setAssetSerial] = useState('');
  const [assetPurchaseDate, setAssetPurchaseDate] = useState('');
  const [assetPurchaseCost, setAssetPurchaseCost] = useState('');
  const [assetVendor, setAssetVendor] = useState('');
  const [assetWarrantyExpiry, setAssetWarrantyExpiry] = useState('');
  const [assetStatus, setAssetStatus] = useState('In Office');
  const [assetLocation, setAssetLocation] = useState('In Office');
  const [assetCondition, setAssetCondition] = useState('Good');
  const [assetNotes, setAssetNotes] = useState('');
  const [assetSubmitting, setAssetSubmitting] = useState(false);

  const isAdmin = user.role === 'admin';
  const isManager = user.role === 'manager';

  // Fetch functions
  const fetchDashboard = async () => {
    try {
      const data = await api.get('/assets/dashboard');
      setDashboardData(data);
    } catch (err) {
      console.error('Failed to fetch dashboard', err);
    }
  };

  const fetchAssets = async () => {
    try {
      let queryParams = [];
      if (assetSearch) queryParams.push(`search=${encodeURIComponent(assetSearch)}`);
      if (filterStatus) queryParams.push(`status=${encodeURIComponent(filterStatus)}`);
      if (filterDeviceType) queryParams.push(`deviceType=${encodeURIComponent(filterDeviceType)}`);
      if (filterEmployeeId) queryParams.push(`employeeId=${encodeURIComponent(filterEmployeeId)}`);
      
      const queryString = queryParams.length > 0 ? `?${queryParams.join('&')}` : '';
      const data = await api.get(`/assets${queryString}`);
      setAssets(data);
      setCurrentPage(1);
    } catch (err) {
      console.error('Failed to fetch assets', err);
    }
  };

  const fetchConfigs = async () => {
    try {
      const data = await api.get('/assets/configs');
      setConfigs(data);
      if (data.length > 0 && !assetConfigId) {
        setAssetConfigId(data[0]._id);
      }
    } catch (err) {
      console.error('Failed to fetch configs', err);
    }
  };

  const fetchHistory = async () => {
    try {
      const url = historySearch ? `/assets/history?search=${encodeURIComponent(historySearch)}` : '/assets/history';
      const data = await api.get(url);
      setHistory(data);
    } catch (err) {
      console.error('Failed to fetch movement history', err);
    }
  };

  const fetchEmployees = async () => {
    try {
      const data = await api.get('/employees');
      setEmployees(data);
      if (data.length > 0 && !checkoutEmployeeId) {
        const staff = data.find(e => e.role === 'staff');
        setCheckoutEmployeeId(staff ? staff._id : data[0]._id);
      }
    } catch (err) {
      console.error('Failed to fetch employees', err);
    }
  };

  const fetchSingleAssetHistory = async (assetId) => {
    try {
      setLoadingAssetHistory(true);
      const data = await api.get(`/assets/${assetId}/history`);
      setSelectedAssetHistory(data);
    } catch (err) {
      console.error('Failed to fetch single asset history', err);
    } finally {
      setLoadingAssetHistory(false);
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

  // Synchronize internal active tab with parent's active screen navigation
  useEffect(() => {
    if (!subScreen) return;
    if (subScreen === 'asset-dashboard') {
      setActiveTab('dashboard');
      fetchDashboard();
    } else if (subScreen === 'asset-inventory') {
      setActiveTab('inventory');
      fetchAssets();
    } else if (subScreen === 'asset-history') {
      setActiveTab('history');
      fetchHistory();
    } else if (subScreen === 'hardware-configs') {
      setActiveTab('configs');
      fetchConfigs();
    } else if (subScreen === 'asset-reports') {
      setActiveTab('reports');
    }
  }, [subScreen]);

  useEffect(() => {
    fetchAssets();
  }, [assetSearch, filterStatus, filterDeviceType, filterEmployeeId]);

  useEffect(() => {
    fetchHistory();
  }, [historySearch]);

  // Open asset details sheet
  const handleOpenAssetDetails = async (asset) => {
    setSelectedAssetForDetails(asset);
    await fetchSingleAssetHistory(asset._id);
  };

  // Configurations Modals handlers
  const handleOpenCreateConfig = () => {
    setEditingConfig(null);
    setConfigBrand('');
    setConfigModel('');
    setConfigDeviceType('Laptop');
    setConfigCpu('');
    setConfigRam('');
    setConfigStorage('');
    setConfigGpu('Integrated');
    setConfigOs('Windows 11 Pro');
    setConfigWarranty('');
    setConfigSpecs('');
    setShowConfigModal(true);
  };

  const handleOpenEditConfig = (config) => {
    setEditingConfig(config);
    setConfigBrand(config.brand || '');
    setConfigModel(config.modelName || '');
    setConfigDeviceType(config.deviceType || 'Laptop');
    setConfigCpu(config.cpu || '');
    setConfigRam(config.ram || '');
    setConfigStorage(config.storage || '');
    setConfigGpu(config.graphicsCard || 'Integrated');
    setConfigOs(config.operatingSystem || 'None');
    setConfigWarranty(config.warrantyInfo || '');
    setConfigSpecs(config.additionalSpecs || '');
    setShowConfigModal(true);
  };

  const handleConfigSubmit = async (e) => {
    e.preventDefault();
    setConfigSubmitting(true);
    try {
      const payload = {
        brand: configBrand,
        modelName: configModel,
        deviceType: configDeviceType,
        cpu: configCpu,
        ram: configRam,
        storage: configStorage,
        graphicsCard: configGpu,
        operatingSystem: configOs,
        warrantyInfo: configWarranty,
        additionalSpecs: configSpecs
      };

      if (editingConfig) {
        await api.put(`/assets/configs/${editingConfig._id}`, payload);
      } else {
        await api.post('/assets/configs', payload);
      }
      
      await fetchConfigs();
      setShowConfigModal(false);
      setEditingConfig(null);
    } catch (err) {
      alert(`Error saving configuration: ${err.message}`);
    } finally {
      setConfigSubmitting(false);
    }
  };

  const handleDeleteConfig = async (configId) => {
    if (!window.confirm('Are you sure you want to delete this hardware configuration template?')) return;
    try {
      await api.delete(`/assets/configs/${configId}`);
      await fetchConfigs();
    } catch (err) {
      alert(`Error deleting configuration: ${err.message}`);
    }
  };

  // Asset Modals handlers
  const handleOpenEditAsset = (asset) => {
    if (!asset) {
      setEditingAsset(null);
      if (configs.length > 0) setAssetConfigId(configs[0]._id);
      setAssetTag('');
      setAssetSerial('');
      setAssetPurchaseDate('');
      setAssetPurchaseCost('');
      setAssetVendor('');
      setAssetWarrantyExpiry('');
      setAssetStatus('In Office');
      setAssetLocation('In Office');
      setAssetCondition('Good');
      setAssetNotes('');
      setShowAssetModal(true);
    } else {
      setEditingAsset(asset);
      setAssetConfigId(asset.configId?._id || '');
      setAssetTag(asset.assetTag || '');
      setAssetSerial(asset.serialNumber || '');
      setAssetPurchaseDate(asset.purchaseDate ? asset.purchaseDate.substring(0, 10) : '');
      setAssetPurchaseCost(asset.purchaseCost || '');
      setAssetVendor(asset.vendor || '');
      setAssetWarrantyExpiry(asset.warrantyExpiryDate ? asset.warrantyExpiryDate.substring(0, 10) : '');
      setAssetStatus(asset.status || 'In Office');
      setAssetLocation(asset.currentLocation || 'In Office');
      setAssetCondition(asset.assetCondition || 'Good');
      setAssetNotes(asset.notes || '');
      setShowAssetModal(true);
    }
  };

  const handleAssetSubmit = async (e) => {
    e.preventDefault();
    setAssetSubmitting(true);
    try {
      const payload = {
        configId: assetConfigId,
        assetTag,
        serialNumber: assetSerial,
        purchaseDate: assetPurchaseDate || null,
        purchaseCost: assetPurchaseCost ? Number(assetPurchaseCost) : 0,
        vendor: assetVendor,
        warrantyExpiryDate: assetWarrantyExpiry || null,
        status: assetStatus,
        currentLocation: assetLocation,
        assetCondition,
        notes: assetNotes
      };

      if (editingAsset) {
        const updated = await api.put(`/assets/${editingAsset._id}`, payload);
        if (selectedAssetForDetails && selectedAssetForDetails._id === editingAsset._id) {
          setSelectedAssetForDetails(updated);
        }
      } else {
        await api.post('/assets', payload);
      }

      await Promise.all([fetchAssets(), fetchDashboard()]);
      setShowAssetModal(false);
      setEditingAsset(null);
    } catch (err) {
      alert(`Error saving asset: ${err.message}`);
    } finally {
      setAssetSubmitting(false);
    }
  };

  const handleDeleteAsset = async (assetId) => {
    if (!window.confirm('Are you sure you want to delete this asset from the database permanently?')) return;
    try {
      await api.delete(`/assets/${assetId}`);
      await Promise.all([fetchAssets(), fetchDashboard()]);
      if (selectedAssetForDetails && selectedAssetForDetails._id === assetId) {
        setSelectedAssetForDetails(null);
      }
    } catch (err) {
      alert(`Error deleting asset: ${err.message}`);
    }
  };

  // Checkout handlers
  const handleOpenCheckout = (asset) => {
    setSelectedAssetForCheckout(asset);
    setCheckoutExpectedReturn('');
    setCheckoutCondition(asset.assetCondition || 'Good');
    setCheckoutLocation('Deployed at Client');
    setCheckoutRemarks('');
    setShowCheckoutModal(true);
  };

  const handleCheckoutSubmit = async (e) => {
    e.preventDefault();
    setCheckoutSubmitting(true);
    try {
      await api.post('/assets/checkout', {
        assetId: selectedAssetForCheckout._id,
        employeeId: checkoutEmployeeId,
        checkoutDate,
        expectedReturnDate: checkoutExpectedReturn,
        checkoutCondition,
        deploymentLocation: checkoutLocation,
        remarks: checkoutRemarks
      });
      
      await Promise.all([fetchAssets(), fetchDashboard(), fetchHistory()]);
      setShowCheckoutModal(false);
      setSelectedAssetForCheckout(null);
    } catch (err) {
      alert(`Error checking out asset: ${err.message}`);
    } finally {
      setCheckoutSubmitting(false);
    }
  };

  // Check-in handlers
  const handleOpenCheckin = (asset) => {
    setSelectedAssetForCheckin(asset);
    setCheckinCondition(asset.assetCondition || 'Good');
    setCheckinRemarks('');
    setShowCheckinModal(true);
  };

  const handleCheckinSubmit = async (e) => {
    e.preventDefault();
    setCheckinSubmitting(true);
    try {
      await api.post('/assets/checkin', {
        assetId: selectedAssetForCheckin._id,
        returnDate: checkinDate,
        returnCondition: checkinCondition,
        remarks: checkinRemarks
      });

      await Promise.all([fetchAssets(), fetchDashboard(), fetchHistory()]);
      setShowCheckinModal(false);
      setSelectedAssetForCheckin(null);
    } catch (err) {
      alert(`Error processing asset return: ${err.message}`);
    } finally {
      setCheckinSubmitting(false);
    }
  };

  // CSV Exporter helper
  const handleExportCSV = (reportType) => {
    let dataToExport = [];
    let headers = [];
    let filename = '';

    if (reportType === 'inventory') {
      dataToExport = assets.map(a => ({
        'Asset Tag': a.assetTag,
        'Brand': a.configId?.brand || '',
        'Model': a.configId?.modelName || '',
        'Device Type': a.configId?.deviceType || '',
        'Serial Number': a.serialNumber,
        'Status': a.status,
        'Condition': a.assetCondition,
        'Location': a.currentLocation,
        'Current Holder': a.currentUserId ? a.currentUserId.name : 'Stock',
        'Purchase Date': a.purchaseDate ? a.purchaseDate.substring(0,10) : '',
        'Purchase Cost ($)': a.purchaseCost || 0,
        'Vendor': a.vendor || '',
        'Warranty Expiry': a.warrantyExpiryDate ? a.warrantyExpiryDate.substring(0,10) : ''
      }));
      headers = ['Asset Tag', 'Brand', 'Model', 'Device Type', 'Serial Number', 'Status', 'Condition', 'Location', 'Current Holder', 'Purchase Date', 'Purchase Cost ($)', 'Vendor', 'Warranty Expiry'];
      filename = `ITAM_Inventory_Stock_${new Date().toISOString().substring(0,10)}.csv`;
    } 
    else if (reportType === 'overdue') {
      const now = new Date();
      const overdueLogs = history.filter(h => !h.actualReturnDate && new Date(h.expectedReturnDate) < now);
      dataToExport = overdueLogs.map(o => {
        const expDate = new Date(o.expectedReturnDate);
        const daysOverdue = Math.floor((now - expDate) / (1000 * 60 * 60 * 24));
        return {
          'Asset Tag': o.assetId?.assetTag || '',
          'Model': o.assetId?.configId?.modelName || '',
          'Device Type': o.assetId?.configId?.deviceType || '',
          'Serial Number': o.assetId?.serialNumber || '',
          'Employee Name': o.employeeId?.name || '',
          'Employee Email': o.employeeId?.email || '',
          'Checkout Date': o.checkoutDate ? o.checkoutDate.substring(0,10) : '',
          'Expected Return Date': o.expectedReturnDate ? o.expectedReturnDate.substring(0,10) : '',
          'Days Overdue': daysOverdue
        };
      });
      headers = ['Asset Tag', 'Model', 'Device Type', 'Serial Number', 'Employee Name', 'Employee Email', 'Checkout Date', 'Expected Return Date', 'Days Overdue'];
      filename = `ITAM_Overdue_Assets_${new Date().toISOString().substring(0,10)}.csv`;
    }
    else if (reportType === 'movements') {
      dataToExport = history.map(h => ({
        'Asset Tag': h.assetId?.assetTag || '',
        'Model': h.assetId?.configId?.modelName || '',
        'Employee': h.employeeId?.name || '',
        'Checkout Date': h.checkoutDate ? h.checkoutDate.substring(0,10) : '',
        'Expected Return Date': h.expectedReturnDate ? h.expectedReturnDate.substring(0,10) : '',
        'Actual Return Date': h.actualReturnDate ? h.actualReturnDate.substring(0,10) : 'Active Possession',
        'Checkout Condition': h.checkoutCondition || '',
        'Return Condition': h.returnCondition || '',
        'Created By': h.createdBy?.name || 'System',
        'Updated By': h.updatedBy?.name || ''
      }));
      headers = ['Asset Tag', 'Model', 'Employee', 'Checkout Date', 'Expected Return Date', 'Actual Return Date', 'Checkout Condition', 'Return Condition', 'Created By', 'Updated By'];
      filename = `ITAM_Asset_Movements_${new Date().toISOString().substring(0,10)}.csv`;
    }

    if (dataToExport.length === 0) {
      alert('No data records found to export for the selected report.');
      return;
    }

    const csvRows = [];
    csvRows.push(headers.join(','));

    dataToExport.forEach(item => {
      const values = headers.map(header => {
        const val = item[header] === undefined || item[header] === null ? '' : item[header];
        const escaped = ('' + val).replace(/"/g, '""');
        return `"${escaped}"`;
      });
      csvRows.push(values.join(','));
    });

    const csvString = csvRows.join('\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '64px', color: 'var(--text-secondary)' }}>
        <RefreshCw size={36} className="animate-spin" style={{ margin: '0 auto 16px auto', color: 'var(--accent-primary)' }} />
        <p className="stat-desc" style={{ fontSize: '1.1rem' }}>Loading Enterprise ITAM Engine...</p>
      </div>
    );
  }

  // ==========================================
  // STAFF VIEW
  // ==========================================
  if (user.role === 'staff') {
    const myAssets = assets.filter(a => a.currentUserId?._id === user._id);
    const overdueMovements = dashboardData?.recentActivity.filter(m => !m.actualReturnDate && m.employeeId?._id === user._id && new Date(m.expectedReturnDate) < new Date()) || [];

    return (
      <div className="staff-assets-container">
        {overdueMovements.length > 0 && (
          <div className="alert-card animate-pulse" style={{ background: 'var(--danger-glow)', border: '1px solid rgba(239, 68, 68, 0.3)', color: 'var(--danger)', padding: '20px', borderRadius: '12px', display: 'flex', gap: '16px', alignItems: 'center', marginBottom: '24px' }}>
            <AlertOctagon size={32} />
            <div>
              <h4 style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: '4px' }}>OVERDUE ACTION REQUIRED: Equipment Returns Flagged</h4>
              <p style={{ opacity: 0.9, fontSize: '0.95rem' }}>
                You have {overdueMovements.length} assigned corporate hardware asset(s) that have passed their expected return date. 
                Please contact IT administration to arrange a check-in return or request an extension.
              </p>
            </div>
          </div>
        )}

        <div className="dashboard-grid" style={{ marginBottom: '24px' }}>
          <div className="glass-panel stat-card">
            <div className="stat-content">
              <span className="stat-title">My Assigned Assets</span>
              <span className="stat-value">{myAssets.length}</span>
            </div>
            <div className="stat-icon primary">
              <Monitor size={24} />
            </div>
          </div>
          <div className="glass-panel stat-card">
            <div className="stat-content">
              <span className="stat-title">Overdue Devices</span>
              <span className="stat-value" style={{ color: overdueMovements.length > 0 ? 'var(--danger)' : 'var(--text-primary)' }}>
                {overdueMovements.length}
              </span>
            </div>
            <div className="stat-icon danger">
              <AlertOctagon size={24} />
            </div>
          </div>
        </div>

        <div className="glass-panel section-card">
          <div className="section-header">
            <h3>
              <Monitor size={20} style={{ color: 'var(--accent-primary)' }} />
              My Corporate Equipment Custody
            </h3>
          </div>

          {myAssets.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '64px 24px', color: 'var(--text-secondary)' }}>
              <Monitor size={48} style={{ opacity: 0.2, marginBottom: '16px' }} />
              <p style={{ fontSize: '1.05rem' }}>You currently have no corporate devices checked out in your custody.</p>
            </div>
          ) : (
            <div className="table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Asset Tag</th>
                    <th>Device Info</th>
                    <th>Specifications</th>
                    <th>Serial Number</th>
                    <th>Issue Date</th>
                    <th>Expected Return</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {myAssets.map((asset) => {
                    const activeMov = dashboardData?.recentActivity.find(m => m.assetId?._id === asset._id && !m.actualReturnDate);
                    const isOverdue = activeMov && new Date(activeMov.expectedReturnDate) < new Date();
                    
                    return (
                      <tr key={asset._id}>
                        <td style={{ fontWeight: 700, color: 'var(--accent-primary)' }}>{asset.assetTag}</td>
                        <td>
                          <div style={{ fontWeight: 600 }}>{asset.configId?.brand} {asset.configId?.modelName}</div>
                          <span className="badge badge-info" style={{ fontSize: '0.7rem', marginTop: '4px' }}>{asset.configId?.deviceType}</span>
                        </td>
                        <td style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                          <div>CPU: {asset.configId?.cpu}</div>
                          <div>RAM: {asset.configId?.ram} | Storage: {asset.configId?.storage}</div>
                        </td>
                        <td><code style={{ fontSize: '0.85rem' }}>{asset.serialNumber}</code></td>
                        <td>{activeMov ? new Date(activeMov.checkoutDate).toLocaleDateString() : 'N/A'}</td>
                        <td style={{ fontWeight: isOverdue ? 700 : 500, color: isOverdue ? 'var(--danger)' : 'var(--text-primary)' }}>
                          {activeMov ? new Date(activeMov.expectedReturnDate).toLocaleDateString() : 'N/A'}
                        </td>
                        <td>
                          <span className={`badge ${isOverdue ? 'badge-rejected animate-pulse' : 'badge-success'}`}>
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

  // ==========================================
  // ADMIN & MANAGER VIEW
  // ==========================================
  return (
    <div className="itam-admin-container">
      {/* Navigation tabs inside ITAssetModule (Syncs with subScreen as well) */}
      <div className="tabs-container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className={`tab-btn ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => { setActiveTab('dashboard'); fetchDashboard(); }}>
            Dashboard & Charts
          </button>
          <button className={`tab-btn ${activeTab === 'inventory' ? 'active' : ''}`} onClick={() => { setActiveTab('inventory'); fetchAssets(); }}>
            Asset Inventory Stock
          </button>
          <button className={`tab-btn ${activeTab === 'configs' ? 'active' : ''}`} onClick={() => { setActiveTab('configs'); fetchConfigs(); }}>
            Hardware Catalog Templates
          </button>
          <button className={`tab-btn ${activeTab === 'history' ? 'active' : ''}`} onClick={() => { setActiveTab('history'); fetchHistory(); }}>
            Audit Movement Log
          </button>
          <button className={`tab-btn ${activeTab === 'reports' ? 'active' : ''}`} onClick={() => setActiveTab('reports')}>
            Reports & Overdue Monitor
          </button>
        </div>
        
        <div className="export-quick-btn">
          <button onClick={() => handleExportCSV('inventory')} className="btn btn-secondary btn-sm" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            Export Full Stock
          </button>
        </div>
      </div>

      {/* Render subcomponents based on activeTab */}
      {activeTab === 'dashboard' && dashboardData && (
        <AssetDashboard 
          dashboardData={dashboardData}
          setActiveTab={setActiveTab}
          user={user}
        />
      )}

      {activeTab === 'inventory' && (
        <AssetInventory
          assets={assets}
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
          itemsPerPage={itemsPerPage}
          assetSearch={assetSearch}
          setAssetSearch={setAssetSearch}
          filterStatus={filterStatus}
          setFilterStatus={setFilterStatus}
          filterDeviceType={filterDeviceType}
          setFilterDeviceType={setFilterDeviceType}
          filterEmployeeId={filterEmployeeId}
          setFilterEmployeeId={setFilterEmployeeId}
          employees={employees}
          isAdmin={isAdmin}
          handleOpenAssetDetails={handleOpenAssetDetails}
          handleOpenEditAsset={handleOpenEditAsset}
          handleOpenCheckin={handleOpenCheckin}
          handleOpenCheckout={handleOpenCheckout}
          handleDeleteAsset={handleDeleteAsset}
          dashboardData={dashboardData}
        />
      )}

      {activeTab === 'configs' && (
        <HardwareCatalog
          configs={configs}
          isAdmin={isAdmin}
          handleOpenEditConfig={handleOpenEditConfig}
          handleDeleteConfig={handleDeleteConfig}
          handleOpenCreateConfig={handleOpenCreateConfig}
        />
      )}

      {activeTab === 'history' && (
        <AssetHistory
          history={history}
          historySearch={historySearch}
          setHistorySearch={setHistorySearch}
          handleExportCSV={handleExportCSV}
        />
      )}

      {activeTab === 'reports' && (
        <AssetReports
          history={history}
          assets={assets}
          handleExportCSV={handleExportCSV}
        />
      )}

      {/* Asset details slide-out drawer component */}
      <AssetDetailsSheet
        selectedAssetForDetails={selectedAssetForDetails}
        setSelectedAssetForDetails={setSelectedAssetForDetails}
        selectedAssetHistory={selectedAssetHistory}
        loadingAssetHistory={loadingAssetHistory}
      />

      {/* Checkout assignment form modal */}
      <CheckoutModal
        show={showCheckoutModal}
        onClose={() => setShowCheckoutModal(false)}
        asset={selectedAssetForCheckout}
        employees={employees.filter(e => e.role === 'staff')} // only staff for allocations
        checkoutEmployeeId={checkoutEmployeeId}
        setCheckoutEmployeeId={setCheckoutEmployeeId}
        checkoutDate={checkoutDate}
        setCheckoutDate={setCheckoutDate}
        checkoutExpectedReturn={checkoutExpectedReturn}
        setCheckoutExpectedReturn={setCheckoutExpectedReturn}
        checkoutCondition={checkoutCondition}
        setCheckoutCondition={setCheckoutCondition}
        checkoutLocation={checkoutLocation}
        setCheckoutLocation={setCheckoutLocation}
        checkoutRemarks={checkoutRemarks}
        setCheckoutRemarks={setCheckoutRemarks}
        onSubmit={handleCheckoutSubmit}
        submitting={checkoutSubmitting}
      />

      {/* Checkin return form modal */}
      <CheckinModal
        show={showCheckinModal}
        onClose={() => setShowCheckinModal(false)}
        asset={selectedAssetForCheckin}
        checkinDate={checkinDate}
        setCheckinDate={setCheckinDate}
        checkinCondition={checkinCondition}
        setCheckinCondition={setFilterStatus} // condition state mapper
        checkinRemarks={checkinRemarks}
        setCheckinRemarks={setCheckinRemarks}
        onSubmit={handleCheckinSubmit}
        submitting={checkinSubmitting}
      />

      {/* Hardware Configuration modal */}
      <ConfigModal
        show={showConfigModal}
        onClose={() => setShowConfigModal(false)}
        editingConfig={editingConfig}
        brand={configBrand}
        setBrand={setConfigBrand}
        model={configModel}
        setModel={setConfigModel}
        deviceType={configDeviceType}
        setDeviceType={setConfigDeviceType}
        cpu={configCpu}
        setCpu={setConfigCpu}
        ram={configRam}
        setRam={setConfigRam}
        storage={configStorage}
        setStorage={setConfigStorage}
        gpu={configGpu}
        setGpu={setConfigGpu}
        os={configOs}
        setOs={setConfigOs}
        warranty={configWarranty}
        setWarranty={setConfigWarranty}
        specs={configSpecs}
        setSpecs={setConfigSpecs}
        onSubmit={handleConfigSubmit}
        submitting={configSubmitting}
      />

      {/* Asset registration form modal */}
      <AssetModal
        show={showAssetModal}
        onClose={() => setShowAssetModal(false)}
        editingAsset={editingAsset}
        configs={configs}
        configId={assetConfigId}
        setConfigId={setAssetConfigId}
        tag={assetTag}
        setTag={setAssetTag}
        serial={assetSerial}
        setSerial={setAssetSerial}
        purchaseDate={assetPurchaseDate}
        setPurchaseDate={setAssetPurchaseDate}
        purchaseCost={assetPurchaseCost}
        setPurchaseCost={setAssetPurchaseCost}
        vendor={assetVendor}
        setVendor={setAssetVendor}
        warrantyExpiry={assetWarrantyExpiry}
        setWarrantyExpiry={setAssetWarrantyExpiry}
        status={assetStatus}
        setStatus={setAssetStatus}
        location={assetLocation}
        setLocation={setAssetLocation}
        condition={assetCondition}
        setCondition={setAssetCondition}
        notes={assetNotes}
        setNotes={setAssetNotes}
        onSubmit={handleAssetSubmit}
        submitting={assetSubmitting}
      />
    </div>
  );
}
