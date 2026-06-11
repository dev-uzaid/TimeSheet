import React, { useState } from 'react';
import { useCreateEmployeeMutation, useGetAdminsAndManagerQuery, useGetManagersQuery } from "../redux/services/employeeApi";
import { useGetCompaniesQuery } from '../redux/services/companyApi';
import { toast } from 'react-toastify';

function AddEmployeeModal({ isOpen, onClose }) {
    if (!isOpen) return null;

    const [createEmployee, { isLoading }] = useCreateEmployeeMutation();
    const { data: companyData, isLoading: companyLoading } = useGetCompaniesQuery();
    const { data: AdminAndManagers, isLoading: managersLoading } = useGetAdminsAndManagerQuery();
    const companies = companyData?.companies || [];

    const [formData, setFormData] = useState({
        name: "",
        email: "",
        role: "staff",
        managerId: "",
        password: "",
        company: ""
    });
    const [errorMsg, setErrorMsg] = useState("");

    const handleRoleChange = (newRole) => {
        setFormData(prev => ({
            ...prev,
            role: newRole,
            // If admin is selected, clear managerId since admins don't have reporting managers
            managerId: newRole === 'admin' ? "" : prev.managerId
        }));
    };

    const handleAddEmployee = async (e) => {
        e.preventDefault();
        if (!formData.name || !formData.email || !formData.password || !formData.role) {
            setErrorMsg("Please fill in all mandatory fields.");
            return;
        }

        try {
            setErrorMsg("");
            await createEmployee({
                name: formData.name,
                email: formData.email,
                password: formData.password,
                role: formData.role,
                managerId: formData.managerId || null,
                company: formData.company || null
            }).unwrap();
            onClose();
        } catch (error) {
            console.error(error);
            setErrorMsg(error.data?.message || error.message || "Failed to create employee.");
        }
    };


    return (
        <div className="modal-overlay">
            <div className="glass-panel modal-content" style={{ maxWidth: '500px' }}>
                <div className="modal-header">
                    <h3>Create New Employee Profile</h3>
                    <button className="modal-close" onClick={onClose}>Close</button>
                </div>

                <form onSubmit={handleAddEmployee}>
                    {errorMsg && (
                        <p className="stat-desc" style={{ color: 'var(--danger)', marginBottom: '16px', fontWeight: 600 }}>
                            {errorMsg}
                        </p>
                    )}

                    <div className="form-group">
                        <label>Employee Name</label>
                        <input
                            type="text"
                            className="form-control"
                            required
                            placeholder="e.g. Jane Doe"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        />
                    </div>

                    <div className="form-group">
                        <label>Email Address</label>
                        <input
                            type="email"
                            className="form-control"
                            required
                            placeholder="john@example.com"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        />
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label>Organization Role</label>
                            <select
                                className="form-control"
                                value={formData.role}
                                onChange={(e) => handleRoleChange(e.target.value)}
                            >
                                <option value="staff">Staff</option>
                                <option value="manager">Manager</option>
                                <option value="admin">Admin</option>
                            </select>
                        </div>

                        <div className="form-group">
                            <label>Temporary Password</label>
                            <input
                                type="password"
                                className="form-control"
                                required
                                placeholder="••••••••"
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label>Company (Optional)</label>
                            <select
                                className="form-control"
                                value={formData.company}
                                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                            >
                                <option value="">Select Company...</option>
                                {companies.map((company) => (
                                    <option key={company._id} value={company._id}>
                                        {company.companyName}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="form-group">
                            <label>Assign Reporting Manager</label>
                            <select
                                className="form-control"
                                value={formData.managerId}
                                onChange={(e) => setFormData({ ...formData, managerId: e.target.value })}
                                disabled={formData.role === 'admin' || managersLoading}
                            >
                                <option value="">{managersLoading ? "Loading admins and managers list..." : "Select Manager"}</option>
                                {AdminAndManagers && AdminAndManagers.map(mgr => (
                                    <option key={mgr._id} value={mgr._id}>{mgr.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
                        <button type="button" className="btn btn-secondary" onClick={onClose}>
                            Cancel
                        </button>
                        <button type="submit" className="btn btn-primary" disabled={isLoading}>
                            {isLoading ? "Saving Profile..." : "Create Employee"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default AddEmployeeModal;