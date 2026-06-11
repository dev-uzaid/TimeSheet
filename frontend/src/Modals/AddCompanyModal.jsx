import React, { useState, useEffect } from 'react';
import { useCreateCompanyMutation, useUpdateCompanyMutation } from '../redux/services/companyApi';
import { toast } from 'react-toastify';

const AddCompanyModal = ({ isOpen, onClose, companyToEdit = null }) => {
  const [addCompany, { isLoading: isCreating, error: createError }] = useCreateCompanyMutation();
  const [updateCompany, { isLoading: isUpdating, error: updateError }] = useUpdateCompanyMutation();

  const isLoading = isCreating || isUpdating;
  const error = companyToEdit ? updateError : createError;

  const [formData, setFormData] = useState({
    companyName: "",
    registrationNo: "",
    industry: "",
    phone: "",
    email: "",
    address: "",
    status: "Active"
  });

  useEffect(() => {
    if (companyToEdit) {
      setFormData({
        companyName: companyToEdit.companyName || "",
        registrationNo: companyToEdit.registrationNo || "",
        industry: companyToEdit.industry || "",
        phone: companyToEdit.phone || "",
        email: companyToEdit.email || "",
        address: companyToEdit.address || "",
        status: companyToEdit.status || "Active"
      });
    } else {
      setFormData({
        companyName: "",
        registrationNo: "",
        industry: "",
        phone: "",
        email: "",
        address: "",
        status: "Active"
      });
    }
  }, [companyToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (companyToEdit) {
        await updateCompany({ id: companyToEdit._id, companyData: formData }).unwrap();
        toast.success("Company profile updated successfully");
      } else {
        await addCompany(formData).unwrap();
        toast.success("Company registered successfully");
      }
      onClose();
    } catch (err) {
      console.error('Failed to save company:', err);
    }
  };

  const errorMessage = error?.data?.message || error?.data?.errors?.join(', ') || error?.message;

  return (
    <div className="modal-overlay">
      <div className="glass-panel modal-content" style={{ maxWidth: '550px' }}>
        <div className="modal-header">
          <h3>{companyToEdit ? 'Update Company Profile' : 'Register New Company'}</h3>
          <button className="modal-close" onClick={onClose}>Close</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Company Name (Required)</label>
            <input 
              type="text" 
              className="form-control"
              placeholder="e.g. Acme Corporation" 
              required
              value={formData.companyName} 
              onChange={(e) => setFormData({ ...formData, companyName: e.target.value })} 
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Registration No.</label>
              <input 
                type="text" 
                className="form-control"
                placeholder="e.g. REG-987654" 
                value={formData.registrationNo} 
                onChange={(e) => setFormData({ ...formData, registrationNo: e.target.value })} 
              />
            </div>
            <div className="form-group">
              <label>Industry</label>
              <input 
                type="text" 
                className="form-control"
                placeholder="e.g. Technology" 
                value={formData.industry} 
                onChange={(e) => setFormData({ ...formData, industry: e.target.value })} 
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Phone Number</label>
              <input 
                type="text" 
                className="form-control"
                placeholder="10-digit number" 
                value={formData.phone} 
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })} 
              />
            </div>
            <div className="form-group">
              <label>Email Address</label>
              <input 
                type="email" 
                className="form-control"
                placeholder="info@company.com" 
                value={formData.email} 
                onChange={(e) => setFormData({ ...formData, email: e.target.value })} 
              />
            </div>
          </div>

          <div className="form-group">
            <label>Location Address</label>
            <input 
              type="text" 
              className="form-control"
              placeholder="Full physical office location" 
              value={formData.address} 
              onChange={(e) => setFormData({ ...formData, address: e.target.value })} 
            />
          </div>

          <div className="form-group">
            <label>Status</label>
            <select 
              className="form-control" 
              value={formData.status} 
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            >
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>

          {errorMessage && (
            <p className="stat-desc" style={{ color: 'var(--danger)', marginBottom: '16px', fontWeight: 600 }}>
              Error: {errorMessage}
            </p>
          )}

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={isLoading}>
              {isLoading ? (companyToEdit ? 'Updating...' : 'Registering...') : (companyToEdit ? 'Update Company' : 'Register Company')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddCompanyModal;