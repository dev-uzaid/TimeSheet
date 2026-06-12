import React from 'react';
import { X, MapPin, History } from 'lucide-react';

export default function AssetDetailsSheet({
  selectedAssetForDetails,
  setSelectedAssetForDetails,
  selectedAssetHistory,
  loadingAssetHistory
}) {
  if (!selectedAssetForDetails) return null;

  return (
    <div className="modal-overlay">
      <div className="glass-panel modal-content" style={{ maxWidth: '800px', width: '100%', padding: '24px' }}>
        <div className="modal-header" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '12px', marginBottom: '16px' }}>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <h3 style={{ margin: 0, fontSize: '1.35rem' }}>Asset Profile details: {selectedAssetForDetails.assetTag}</h3>
            <span className={`badge ${
              selectedAssetForDetails.status === 'In Office' ? 'badge-success' :
              selectedAssetForDetails.status === 'Deployed at Client' ? 'badge-submitted' :
              'badge-queried'
            }`} style={{ fontSize: '0.75rem' }}>
              {selectedAssetForDetails.status}
            </span>
          </div>
          <button className="modal-close" onClick={() => setSelectedAssetForDetails(null)}>
            <X size={20} />
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '24px', maxHeight: '500px', overflowY: 'auto' }}>
          {/* Left Column: Specifications and Details */}
          <div>
            <h4 style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '6px', marginBottom: '12px', fontSize: '1rem', color: 'var(--accent-primary)' }}>
              Hardware Configurations
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '0.85rem', marginBottom: '20px' }}>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Brand / Model:</span>
                <div style={{ fontWeight: 600 }}>{selectedAssetForDetails.configId?.brand || 'Generic'} {selectedAssetForDetails.configId?.modelName}</div>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Device Type:</span>
                <div style={{ fontWeight: 600 }}>{selectedAssetForDetails.configId?.deviceType}</div>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Processor:</span>
                <div style={{ fontWeight: 600 }}>{selectedAssetForDetails.configId?.cpu}</div>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>RAM / Storage:</span>
                <div style={{ fontWeight: 600 }}>{selectedAssetForDetails.configId?.ram} / {selectedAssetForDetails.configId?.storage}</div>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Graphics Card (GPU):</span>
                <div style={{ fontWeight: 600 }}>{selectedAssetForDetails.configId?.graphicsCard || 'Integrated'}</div>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Operating System:</span>
                <div style={{ fontWeight: 600 }}>{selectedAssetForDetails.configId?.operatingSystem || 'None'}</div>
              </div>
            </div>

            <h4 style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '6px', marginBottom: '12px', fontSize: '1rem', color: 'var(--accent-primary)' }}>
              Procurement & Warranty Details
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '0.85rem', marginBottom: '20px' }}>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Vendor / Supplier:</span>
                <div style={{ fontWeight: 600 }}>{selectedAssetForDetails.vendor || '-'}</div>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Purchase Date:</span>
                <div style={{ fontWeight: 600 }}>
                  {selectedAssetForDetails.purchaseDate ? new Date(selectedAssetForDetails.purchaseDate).toLocaleDateString() : '-'}
                </div>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Purchase Cost:</span>
                <div style={{ fontWeight: 600 }}>
                  {selectedAssetForDetails.purchaseCost ? `$${selectedAssetForDetails.purchaseCost.toLocaleString()}` : '-'}
                </div>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Warranty Expiry:</span>
                <div style={{ fontWeight: 600 }}>
                  {selectedAssetForDetails.warrantyExpiryDate ? new Date(selectedAssetForDetails.warrantyExpiryDate).toLocaleDateString() : '-'}
                </div>
              </div>
            </div>

            <h4 style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '6px', marginBottom: '12px', fontSize: '1rem', color: 'var(--accent-primary)' }}>
              Condition & Inventory Placement
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '0.85rem' }}>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Current Location:</span>
                <div style={{ fontWeight: 600 }}><MapPin size={12} style={{ display: 'inline', marginRight: '4px' }} />{selectedAssetForDetails.currentLocation}</div>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Asset Condition:</span>
                <div style={{ fontWeight: 600 }}>{selectedAssetForDetails.assetCondition}</div>
              </div>
              <div style={{ gridColumn: 'span 2' }}>
                <span style={{ color: 'var(--text-muted)' }}>Registry notes:</span>
                <div style={{ fontStyle: 'italic' }}>{selectedAssetForDetails.notes || 'No registry notes.'}</div>
              </div>
            </div>
          </div>

          {/* Right Column: Custody History Timeline */}
          <div style={{ borderLeft: '1px solid var(--border-color)', paddingLeft: '20px' }}>
            <h4 style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '6px', marginBottom: '16px', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--accent-primary)' }}>
              <History size={16} />
              Custody Transfer Logs
            </h4>

            {loadingAssetHistory ? (
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Loading asset history...</p>
            ) : selectedAssetHistory.length === 0 ? (
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontStyle: 'italic', padding: '10px 0' }}>
                No checkout assignments recorded for this asset.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', position: 'relative', paddingLeft: '14px', borderLeft: '2px solid var(--border-color)' }}>
                {selectedAssetHistory.map((mov, idx) => {
                  const isActive = !mov.actualReturnDate;
                  return (
                    <div key={mov._id} style={{ position: 'relative', fontSize: '0.8rem' }}>
                      {/* Point node */}
                      <span style={{ 
                        position: 'absolute', 
                        left: '-20px', 
                        top: '2px', 
                        width: '10px', 
                        height: '10px', 
                        borderRadius: '50%', 
                        background: isActive ? 'var(--accent-primary)' : 'var(--success)' 
                      }} />
                      
                      <div style={{ fontWeight: 600, color: isActive ? 'var(--accent-primary)' : 'var(--text-primary)' }}>
                        {isActive ? 'Issued Checkout Assignment' : 'Returned check-in completed'}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                        Employee: <strong>{mov.employeeId?.name || 'Staff Member'}</strong>
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        Checkout: {new Date(mov.checkoutDate).toLocaleDateString()}
                      </div>
                      {mov.actualReturnDate && (
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          Returned: {new Date(mov.actualReturnDate).toLocaleDateString()} (Condition: {mov.returnCondition})
                        </div>
                      )}
                      {mov.remarks && (
                        <div style={{ fontStyle: 'italic', fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '4px', background: 'rgba(255,255,255,0.01)', padding: '4px', borderRadius: '4px' }}>
                          Notes: {mov.remarks}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '24px', borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
          <button type="button" className="btn btn-secondary btn-sm" onClick={() => setSelectedAssetForDetails(null)}>
            Close Panel
          </button>
        </div>
      </div>
    </div>
  );
}
