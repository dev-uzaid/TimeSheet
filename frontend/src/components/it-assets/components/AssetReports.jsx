import React from 'react';
import { AlertOctagon, Download } from 'lucide-react';

export default function AssetReports({
  history,
  assets,
  handleExportCSV
}) {
  const now = new Date();
  const activeCheckouts = history.filter(h => !h.actualReturnDate);

  return (
    <div className="tab-pane-content">
      {/* Overdue Monitoring Panel */}
      <div className="glass-panel section-card" style={{ marginBottom: '24px' }}>
        <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: 'none', marginBottom: '16px' }}>
          <h3 style={{ marginBottom: 0 }}>
            <AlertOctagon size={20} style={{ color: 'var(--danger)' }} />
            Delinquent & Overdue Return Monitoring
          </h3>
          <button onClick={() => handleExportCSV('overdue')} className="btn btn-secondary btn-sm" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Download size={14} />
            Export Overdue Report (CSV)
          </button>
        </div>

        {activeCheckouts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '32px', color: 'var(--text-secondary)' }}>
            All corporate equipment checked out is currently within limits. No overdue returns.
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Asset Tag</th>
                  <th>Device Model</th>
                  <th>Assignee Employee</th>
                  <th>Checkout Date</th>
                  <th>Expected Return</th>
                  <th>Days Remaining</th>
                  <th>Days Overdue</th>
                  <th>Warning Category</th>
                </tr>
              </thead>
              <tbody>
                {activeCheckouts.map((mov) => {
                  const expDate = new Date(mov.expectedReturnDate);
                  const diffTime = expDate - now;
                  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                  
                  const isOverdue = diffDays < 0;
                  const daysOverdue = isOverdue ? Math.abs(diffDays) : 0;
                  const isDueSoon = !isOverdue && diffDays <= 7;

                  let categoryText = 'Returned/Normal';
                  let categoryClass = 'badge-success';

                  if (isOverdue) {
                    categoryText = 'Overdue';
                    categoryClass = 'badge-rejected';
                  } else if (isDueSoon) {
                    categoryText = 'Due Soon';
                    categoryClass = 'badge-warning';
                  } else {
                    categoryText = 'Returned / Active';
                    categoryClass = 'badge-submitted';
                  }

                  return (
                    <tr key={mov._id}>
                      <td style={{ fontWeight: 700, color: 'var(--accent-primary)' }}>{mov.assetId?.assetTag}</td>
                      <td>{mov.assetId?.configId?.brand} {mov.assetId?.configId?.modelName}</td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{mov.employeeId?.name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{mov.employeeId?.email}</div>
                      </td>
                      <td>{new Date(mov.checkoutDate).toLocaleDateString()}</td>
                      <td style={{ fontWeight: 600 }}>{expDate.toLocaleDateString()}</td>
                      <td>{isOverdue ? '0' : diffDays} days</td>
                      <td style={{ color: isOverdue ? 'var(--danger)' : 'var(--text-muted)', fontWeight: isOverdue ? 700 : 400 }}>
                        {isOverdue ? `${daysOverdue} days overdue` : '-'}
                      </td>
                      <td>
                        <span className={`badge ${categoryClass} ${isOverdue ? 'animate-pulse' : ''}`}>
                          {categoryText}
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

      {/* Quick Statistics Summary Card */}
      <div className="dashboard-grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        <div className="glass-panel section-card">
          <div className="section-header">
            <h3>Financial Inventory Value</h3>
          </div>
          <div style={{ padding: '10px 0' }}>
            {(() => {
              const totalValue = assets.reduce((sum, a) => sum + (a.purchaseCost || 0), 0);
              const averageValue = assets.length > 0 ? (totalValue / assets.length).toFixed(2) : 0;
              return (
                <div>
                  <div style={{ marginBottom: '20px' }}>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Total Procurement Capital Invested:</span>
                    <div style={{ fontSize: '2.5rem', fontWeight: 800, background: 'var(--accent-gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginTop: '6px', fontFamily: 'Outfit' }}>
                      ${totalValue.toLocaleString()}
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
                    <div>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Average Unit Procurement Cost</span>
                      <div style={{ fontSize: '1.25rem', fontWeight: 700, marginTop: '4px' }}>${parseFloat(averageValue).toLocaleString()}</div>
                    </div>
                    <div>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Registered Assets Quantity</span>
                      <div style={{ fontSize: '1.25rem', fontWeight: 700, marginTop: '4px' }}>{assets.length} items</div>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>

        <div className="glass-panel section-card">
          <div className="section-header">
            <h3>Warranty Compliance Tracking</h3>
          </div>
          <div style={{ padding: '10px 0' }}>
            {(() => {
              const expiredWarrantyCount = assets.filter(a => a.warrantyExpiryDate && new Date(a.warrantyExpiryDate) < now).length;
              const activeWarrantyCount = assets.filter(a => !a.warrantyExpiryDate || new Date(a.warrantyExpiryDate) >= now).length;
              return (
                <div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--success)' }} />
                        Active Warranty Covered
                      </span>
                      <strong>{activeWarrantyCount} devices</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--danger)' }} />
                        Warranty Expired (Out of Coverage)
                      </span>
                      <strong style={{ color: 'var(--danger)' }}>{expiredWarrantyCount} devices</strong>
                    </div>
                  </div>
                  <div style={{ background: 'var(--bg-tertiary)', height: '10px', borderRadius: '5px', overflow: 'hidden', display: 'flex', marginTop: '24px' }}>
                    <div style={{ background: 'var(--success)', width: `${(activeWarrantyCount / (assets.length || 1)) * 100}%` }} />
                    <div style={{ background: 'var(--danger)', width: `${(expiredWarrantyCount / (assets.length || 1)) * 100}%` }} />
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      </div>
    </div>
  );
}
