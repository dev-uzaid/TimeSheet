import React from 'react';

export function CheckoutModal({
  show,
  onClose,
  asset,
  employees,
  checkoutEmployeeId,
  setCheckoutEmployeeId,
  checkoutDate,
  setCheckoutDate,
  checkoutExpectedReturn,
  setCheckoutExpectedReturn,
  checkoutCondition,
  setCheckoutCondition,
  checkoutLocation,
  setCheckoutLocation,
  checkoutRemarks,
  setCheckoutRemarks,
  onSubmit,
  submitting
}) {
  if (!show || !asset) return null;

  return (
    <div className="modal-overlay">
      <div className="glass-panel modal-content">
        <div className="modal-header">
          <h3>Deploy Checkout Custody: {asset.assetTag}</h3>
          <button className="modal-close" onClick={onClose}>Close</button>
        </div>
        <form onSubmit={onSubmit}>
          <div className="form-group">
            <label>Assign to Corporate Employee</label>
            <select className="form-control" required value={checkoutEmployeeId} onChange={(e) => setCheckoutEmployeeId(e.target.value)}>
              <option value="" disabled>-- Select Employee --</option>
              {employees.map(emp => (
                <option key={emp._id} value={emp._id}>{emp.name} ({emp.email})</option>
              ))}
            </select>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Issue Date</label>
              <input type="date" className="form-control" required value={checkoutDate} onChange={(e) => setCheckoutDate(e.target.value)} />
            </div>
            <div className="form-group">
              <label>Expected Return Date</label>
              <input type="date" className="form-control" required value={checkoutExpectedReturn} onChange={(e) => setCheckoutExpectedReturn(e.target.value)} />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Asset Condition at Handover</label>
              <select className="form-control" value={checkoutCondition} onChange={(e) => setCheckoutCondition(e.target.value)}>
                <option value="New">Sealed / New</option>
                <option value="Excellent">Excellent</option>
                <option value="Good">Good</option>
                <option value="Fair">Fair</option>
                <option value="Poor">Poor</option>
              </select>
            </div>
            <div className="form-group">
              <label>Deployment Location</label>
              <input type="text" className="form-control" required placeholder="e.g. Client Site Alpha, Home Office" value={checkoutLocation} onChange={(e) => setCheckoutLocation(e.target.value)} />
            </div>
          </div>

          <div className="form-group">
            <label>Remarks / Checkout Notes</label>
            <textarea className="form-control" placeholder="Include any peripheral details issued (cables, bags, chargers)..." rows={2} value={checkoutRemarks} onChange={(e) => setCheckoutRemarks(e.target.value)} />
          </div>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '16px' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Issuing deployment...' : 'Deploy Device'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function CheckinModal({
  show,
  onClose,
  asset,
  checkinDate,
  setCheckinDate,
  checkinCondition,
  setCheckinCondition,
  checkinRemarks,
  setCheckinRemarks,
  onSubmit,
  submitting
}) {
  if (!show || !asset) return null;

  return (
    <div className="modal-overlay">
      <div className="glass-panel modal-content">
        <div className="modal-header">
          <h3>Process Hardware check-in: {asset.assetTag}</h3>
          <button className="modal-close" onClick={onClose}>Close</button>
        </div>
        <form onSubmit={onSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label>Actual Return Date</label>
              <input type="date" className="form-control" required value={checkinDate} onChange={(e) => setCheckinDate(e.target.value)} />
            </div>
            <div className="form-group">
              <label>Return Condition Status</label>
              <select className="form-control" value={checkinCondition} onChange={(e) => setCheckinCondition(e.target.value)}>
                <option value="Excellent">Excellent</option>
                <option value="Good">Good</option>
                <option value="Fair">Fair / Scratched</option>
                <option value="Poor">Poor / Damaged</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>Remarks / Return Audit Notes</label>
            <textarea className="form-control" placeholder="Include notes on scratches, damage details, missing charger notes..." rows={3} value={checkinRemarks} onChange={(e) => setCheckinRemarks(e.target.value)} />
          </div>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '16px' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Receiving check-in...' : 'Process Return'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function ConfigModal({
  show,
  onClose,
  editingConfig,
  brand,
  setBrand,
  model,
  setModel,
  deviceType,
  setDeviceType,
  cpu,
  setCpu,
  ram,
  setRam,
  storage,
  setStorage,
  gpu,
  setGpu,
  os,
  setOs,
  warranty,
  setWarranty,
  specs,
  setSpecs,
  onSubmit,
  submitting
}) {
  if (!show) return null;

  return (
    <div className="modal-overlay">
      <div className="glass-panel modal-content">
        <div className="modal-header">
          <h3>{editingConfig ? 'Update Catalog Template' : 'Create Hardware Configuration'}</h3>
          <button className="modal-close" onClick={onClose}>Close</button>
        </div>
        <form onSubmit={onSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label>Brand Name</label>
              <input type="text" className="form-control" required placeholder="e.g. Apple, Dell, Lenovo" value={brand} onChange={(e) => setBrand(e.target.value)} />
            </div>
            <div className="form-group">
              <label>Model Description</label>
              <input type="text" className="form-control" required placeholder="e.g. MacBook Pro M3 Pro, Latitude 5440" value={model} onChange={(e) => setModel(e.target.value)} />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Device Category Type</label>
              <select className="form-control" value={deviceType} onChange={(e) => setDeviceType(e.target.value)}>
                <option value="Laptop">Laptop Computer</option>
                <option value="Desktop">Desktop Tower</option>
                <option value="Monitor">External Monitor</option>
                <option value="Printer">Office Printer</option>
                <option value="Server">Server Blade</option>
                <option value="Mobile">Mobile Phone</option>
                <option value="Other">Other Peripherals</option>
              </select>
            </div>
            <div className="form-group">
              <label>Processor (CPU)</label>
              <input type="text" className="form-control" required placeholder="e.g. M3 Pro 11-Core, Intel i7-13700H" value={cpu} onChange={(e) => setCpu(e.target.value)} />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Memory (RAM Size)</label>
              <input type="text" className="form-control" required placeholder="e.g. 18GB, 32GB DDR5" value={ram} onChange={(e) => setRam(e.target.value)} />
            </div>
            <div className="form-group">
              <label>Hard Drive (Storage Capacity)</label>
              <input type="text" className="form-control" required placeholder="e.g. 512GB SSD, 1TB NVMe" value={storage} onChange={(e) => setStorage(e.target.value)} />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Graphics Controller (GPU)</label>
              <input type="text" className="form-control" placeholder="e.g. NVIDIA RTX 4060, Intel Iris Xe" value={gpu} onChange={(e) => setGpu(e.target.value)} />
            </div>
            <div className="form-group">
              <label>Operating System (OS)</label>
              <input type="text" className="form-control" placeholder="e.g. Windows 11 Pro, macOS, Linux" value={os} onChange={(e) => setOs(e.target.value)} />
            </div>
          </div>

          <div className="form-group">
            <label>Warranty Terms Information</label>
            <input type="text" className="form-control" placeholder="e.g. AppleCare+ 3 Year, Dell ProSupport" value={warranty} onChange={(e) => setWarranty(e.target.value)} />
          </div>

          <div className="form-group">
            <label>Additional Technical Specifications</label>
            <textarea className="form-control" placeholder="Ports, Screen resolution details..." rows={2} value={specs} onChange={(e) => setSpecs(e.target.value)} />
          </div>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '16px' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Saving catalog...' : 'Save Template'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function AssetModal({
  show,
  onClose,
  editingAsset,
  configs,
  configId,
  setConfigId,
  tag,
  setTag,
  serial,
  setSerial,
  purchaseDate,
  setPurchaseDate,
  purchaseCost,
  setPurchaseCost,
  vendor,
  setVendor,
  warrantyExpiry,
  setWarrantyExpiry,
  status,
  setStatus,
  location,
  setLocation,
  condition,
  setCondition,
  notes,
  setNotes,
  onSubmit,
  submitting
}) {
  if (!show) return null;

  return (
    <div className="modal-overlay">
      <div className="glass-panel modal-content" style={{ maxWidth: '650px' }}>
        <div className="modal-header">
          <h3>{editingAsset ? 'Update Registered Asset details' : 'Register Physical Asset'}</h3>
          <button className="modal-close" onClick={onClose}>Close</button>
        </div>
        <form onSubmit={onSubmit}>
          <div className="form-group">
            <label>Link to Catalog Configuration Model</label>
            <select className="form-control" required value={configId} onChange={(e) => setConfigId(e.target.value)}>
              <option value="" disabled>-- Select Hardware Model --</option>
              {configs.map(c => (
                <option key={c._id} value={c._id}>{c.brand} {c.modelName} ({c.deviceType} | {c.cpu})</option>
              ))}
            </select>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Unique Asset Tag Identifier</label>
              <input type="text" className="form-control" required placeholder="e.g. AST-100" value={tag} onChange={(e) => setTag(e.target.value)} />
            </div>
            <div className="form-group">
              <label>Manufacturer Serial Number (S/N)</label>
              <input type="text" className="form-control" required placeholder="e.g. SN-89828X" value={serial} onChange={(e) => setSerial(e.target.value)} />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Purchase Date</label>
              <input type="date" className="form-control" value={purchaseDate} onChange={(e) => setPurchaseDate(e.target.value)} />
            </div>
            <div className="form-group">
              <label>Purchase Cost ($ USD)</label>
              <input type="number" className="form-control" placeholder="e.g. 1500" value={purchaseCost} onChange={(e) => setPurchaseCost(e.target.value)} />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Vendor / Supplier Name</label>
              <input type="text" className="form-control" placeholder="e.g. Apple Business, CDW" value={vendor} onChange={(e) => setVendor(e.target.value)} />
            </div>
            <div className="form-group">
              <label>Warranty Expiry Date</label>
              <input type="date" className="form-control" value={warrantyExpiry} onChange={(e) => setWarrantyExpiry(e.target.value)} />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Initial Asset Status</label>
              <select className="form-control" value={status} onChange={(e) => setStatus(e.target.value)} disabled={editingAsset && editingAsset.status === 'Deployed at Client'}>
                <option value="In Office">In Office (Stock)</option>
                <option value="Under Maintenance">Under Maintenance</option>
                <option value="Lost">Lost</option>
                <option value="Retired">Retired</option>
              </select>
            </div>
            <div className="form-group">
              <label>Office Physical Placement Location</label>
              <input type="text" className="form-control" placeholder="e.g. Server Room, Rack B" value={location} onChange={(e) => setLocation(e.target.value)} />
            </div>
          </div>

          <div className="form-group">
            <label>Physical Condition at Entry</label>
            <select className="form-control" value={condition} onChange={(e) => setCondition(e.target.value)}>
              <option value="New">Brand New / Sealed</option>
              <option value="Excellent">Excellent</option>
              <option value="Good">Good</option>
              <option value="Fair">Fair / Used</option>
              <option value="Poor">Poor / Broken</option>
            </select>
          </div>

          <div className="form-group">
            <label>Asset Notes</label>
            <textarea className="form-control" placeholder="Special hardware notes..." rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '16px' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Registering...' : 'Register Asset'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
