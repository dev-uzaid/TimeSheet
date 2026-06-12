import React from 'react';
import { Monitor, Search, User, MapPin, Info, Edit, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';

export default function AssetInventory({
  assets,
  currentPage,
  setCurrentPage,
  itemsPerPage,
  assetSearch,
  setAssetSearch,
  filterStatus,
  setFilterStatus,
  filterDeviceType,
  setFilterDeviceType,
  filterEmployeeId,
  setFilterEmployeeId,
  employees,
  isAdmin,
  handleOpenAssetDetails,
  handleOpenEditAsset,
  handleOpenCheckin,
  handleOpenCheckout,
  handleDeleteAsset,
  dashboardData
}) {
  const totalAssetsCount = assets.length;
  const totalPages = Math.ceil(totalAssetsCount / itemsPerPage) || 1;
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentAssets = assets.slice(indexOfFirstItem, indexOfLastItem);

  return (
    <div className="tab-pane-content glass-panel section-card">
      <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', borderBottom: 'none', marginBottom: '16px' }}>
        <h3 style={{ marginBottom: 0 }}>
          <Monitor size={20} style={{ color: 'var(--accent-primary)' }} />
          Physical Assets Registry Stock
        </h3>
        
        {isAdmin && (
          <button onClick={() => handleOpenEditAsset(null)} className="btn btn-primary btn-sm">
            Register New Asset
          </button>
        )}
      </div>

      {/* Advanced Filtering Form Row */}
      <div className="filters-row" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px', background: 'var(--bg-secondary)', padding: '16px', borderRadius: '8px', border: '1px solid var(--border-color)', marginBottom: '20px' }}>
        {/* Search */}
        <div style={{ position: 'relative' }}>
          <input 
            type="text" 
            className="form-control" 
            placeholder="Search Tag, S/N, Vendor..." 
            value={assetSearch}
            onChange={(e) => setAssetSearch(e.target.value)}
            style={{ paddingLeft: '36px', height: '42px', width: '100%', fontSize: '0.85rem' }}
          />
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '13px', color: 'var(--text-muted)' }} />
        </div>

        {/* Status Filter */}
        <select className="form-control" style={{ height: '42px', fontSize: '0.85rem' }} value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
          <option value="">All Statuses</option>
          <option value="In Office">In Office</option>
          <option value="Deployed at Client">Deployed at Client</option>
          <option value="Under Maintenance">Under Maintenance</option>
          <option value="Lost">Lost</option>
          <option value="Retired">Retired</option>
        </select>

        {/* Device Type Filter */}
        <select className="form-control" style={{ height: '42px', fontSize: '0.85rem' }} value={filterDeviceType} onChange={(e) => setFilterDeviceType(e.target.value)}>
          <option value="">All Device Types</option>
          <option value="Laptop">Laptop</option>
          <option value="Desktop">Desktop</option>
          <option value="Monitor">Monitor</option>
          <option value="Printer">Printer</option>
          <option value="Server">Server</option>
          <option value="Mobile">Mobile Phone</option>
          <option value="Other">Other Accessories</option>
        </select>

        {/* Holder Filter */}
        <select className="form-control" style={{ height: '42px', fontSize: '0.85rem' }} value={filterEmployeeId} onChange={(e) => setFilterEmployeeId(e.target.value)}>
          <option value="">All Assignees</option>
          {employees.map(e => (
            <option key={e._id} value={e._id}>{e.name} ({e.role})</option>
          ))}
        </select>
        
        {/* Reset filters button */}
        <button 
          onClick={() => {
            setAssetSearch('');
            setFilterStatus('');
            setFilterDeviceType('');
            setFilterEmployeeId('');
          }} 
          className="btn btn-secondary btn-sm" 
          style={{ height: '42px' }}
        >
          Reset Filters
        </button>
      </div>

      {/* Data Table */}
      <div className="table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th>Asset Tag</th>
              <th>Hardware Model</th>
              <th>Device Type</th>
              <th>Serial Number</th>
              <th>Asset Status</th>
              <th>Current Holder</th>
              <th>Warranty Expiry</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {currentAssets.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: '48px', color: 'var(--text-secondary)' }}>
                  <Monitor size={36} style={{ opacity: 0.1, marginBottom: '8px' }} />
                  <p>No matching corporate assets found in database registry.</p>
                </td>
              </tr>
            ) : (
              currentAssets.map((asset) => {
                const isOverdue = dashboardData?.recentActivity?.some(m => !m.actualReturnDate && m.assetId?._id === asset._id && new Date(m.expectedReturnDate) < new Date());
                
                return (
                  <tr key={asset._id} style={{ cursor: 'pointer' }} onClick={() => handleOpenAssetDetails(asset)}>
                    <td style={{ fontWeight: 700, color: 'var(--accent-primary)' }}>{asset.assetTag}</td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{asset.configId?.brand} {asset.configId?.modelName}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{asset.configId?.cpu} / {asset.configId?.ram}</div>
                    </td>
                    <td>
                      <span className="badge badge-info" style={{ textTransform: 'uppercase', fontSize: '0.7rem' }}>
                        {asset.configId?.deviceType}
                      </span>
                    </td>
                    <td><code style={{ fontSize: '0.85rem' }}>{asset.serialNumber}</code></td>
                    <td>
                      <span className={`badge ${
                        asset.status === 'In Office' ? 'badge-success' :
                        asset.status === 'Deployed at Client' ? (isOverdue ? 'badge-rejected animate-pulse' : 'badge-submitted') :
                        asset.status === 'Under Maintenance' ? 'badge-queried' :
                        asset.status === 'Lost' ? 'badge-rejected' : 'badge-draft'
                      }`}>
                        {asset.status === 'Deployed at Client' && isOverdue ? 'Overdue Return' : asset.status}
                      </span>
                    </td>
                    <td onClick={(e) => e.stopPropagation()}>
                      {asset.currentUserId ? (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <User size={12} className="text-muted" />
                          <strong style={{ fontSize: '0.85rem' }}>{asset.currentUserId.name}</strong>
                        </span>
                      ) : (
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Office Stock</span>
                      )}
                    </td>
                    <td>{asset.warrantyExpiryDate ? new Date(asset.warrantyExpiryDate).toLocaleDateString() : <span style={{ color: 'var(--text-muted)' }}>N/A</span>}</td>
                    <td style={{ textAlign: 'right' }} onClick={(e) => e.stopPropagation()}>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                        <button onClick={() => handleOpenAssetDetails(asset)} className="btn btn-secondary btn-sm" style={{ padding: '6px', borderRadius: '4px' }} title="View details & timeline">
                          <Info size={14} />
                        </button>
                        
                        {isAdmin && (
                          <>
                            <button onClick={() => handleOpenEditAsset(asset)} className="btn btn-secondary btn-sm" style={{ padding: '6px', borderRadius: '4px' }} title="Edit asset">
                              <Edit size={14} />
                            </button>
                            
                            {asset.currentUserId ? (
                              <button onClick={() => handleOpenCheckin(asset)} className="btn btn-secondary btn-sm" style={{ padding: '4px 10px', fontSize: '0.75rem', fontWeight: 600 }}>
                                Return
                              </button>
                            ) : (
                              !['Retired', 'Lost'].includes(asset.status) && (
                                <button onClick={() => handleOpenCheckout(asset)} className="btn btn-primary btn-sm" style={{ padding: '4px 10px', fontSize: '0.75rem', fontWeight: 600 }}>
                                  Checkout
                                </button>
                              )
                            )}

                            <button onClick={() => handleDeleteAsset(asset._id)} className="btn btn-danger btn-sm" style={{ padding: '6px', borderRadius: '4px' }} title="Delete asset">
                              <Trash2 size={14} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, totalAssetsCount)} of {totalAssetsCount} assets
          </span>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button 
              onClick={() => setCurrentPage(p => Math.max(p - 1, 1))} 
              disabled={currentPage === 1}
              className="btn btn-secondary btn-sm"
              style={{ padding: '6px 12px' }}
            >
              <ChevronLeft size={16} />
            </button>
            {[...Array(totalPages)].map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentPage(i + 1)}
                className={`btn btn-sm ${currentPage === i + 1 ? 'btn-primary' : 'btn-secondary'}`}
                style={{ minWidth: '32px', padding: '6px' }}
              >
                {i + 1}
              </button>
            ))}
            <button 
              onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))} 
              disabled={currentPage === totalPages}
              className="btn btn-secondary btn-sm"
              style={{ padding: '6px 12px' }}
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
