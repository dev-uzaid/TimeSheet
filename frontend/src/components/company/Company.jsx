import React, { useState } from 'react';
import { useGetCompaniesQuery, useDeleteCompanyMutation } from '../../redux/services/companyApi';
import AddCompanyModal from '../../Modals/AddCompanyModal';
import { Building, Phone, Mail, MapPin, Plus, Trash, Edit } from 'lucide-react';
import { toast } from 'react-toastify';

const Company = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [companyToEdit, setCompanyToEdit] = useState(null);
    const { data, isLoading, isError } = useGetCompaniesQuery();
    const [deleteCompany, { isLoading: isDeleting }] = useDeleteCompanyMutation();
    const companies = data?.companies || [];

    const handleOpen = () => {
        setCompanyToEdit(null);
        setIsModalOpen(true);
    };
    const handleClose = () => {
        setCompanyToEdit(null);
        setIsModalOpen(false);
    };
    const handleEdit = (company) => {
        setCompanyToEdit(company);
        setIsModalOpen(true);
    };

    if (isLoading) {
        return <p className="stat-desc" style={{ textAlign: 'center', padding: '32px' }}>Loading Companies...</p>;
    }

    if (isError) {
        return <p className="stat-desc" style={{ textAlign: 'center', padding: '32px', color: 'var(--danger)' }}>Failed to load companies data.</p>;
    }

    const handleDelete = async (id) => {
        const confirmed = window.confirm(
            "Are you sure you want to delete this company?"
        );

        if (!confirmed) return;

        try {
            await deleteCompany(id).unwrap();
            toast.success("Company deleted successfully");
        } catch (error) {
            toast.error(error?.data?.message || "Failed to delete company");
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h2 style={{ fontSize: '1.8rem', fontWeight: 700 }}>Corporate Registrations</h2>
                    <p className="stat-desc" style={{ marginTop: '4px' }}>Manage corporate organizations and business profiles</p>
                </div>
                <button onClick={handleOpen} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Plus size={16} />
                    Add Company
                </button>
            </div>

            <div className="glass-panel section-card" style={{ padding: '24px' }}>
                <div className="table-wrapper">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Company Name</th>
                                <th>Registration No.</th>
                                <th>Industry</th>
                                <th>Contact Details</th>
                                <th>Location Address</th>
                                <th>Status</th>
                                <th style={{ textAlign: 'left' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {companies.length === 0 ? (
                                <tr>
                                    <td colSpan={7} style={{ textAlign: 'center', padding: '24px', color: 'var(--text-secondary)' }}>
                                        No companies registered yet. Click "Add Company" to register a new one.
                                    </td>
                                </tr>
                            ) : (
                                companies.map((company) => (
                                    <tr key={company._id}>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                <Building size={18} style={{ color: 'var(--accent-primary)' }} />
                                                <span style={{ fontWeight: 600 }}>{company.companyName}</span>
                                            </div>
                                        </td>
                                        <td>{company.registrationNo || '—'}</td>
                                        <td>
                                            <span className="badge badge-submitted" style={{ textTransform: 'none' }}>
                                                {company.industry || 'General'}
                                            </span>
                                        </td>
                                        <td>
                                            <div style={{ fontSize: '0.85rem' }}>
                                                {company.email && (
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-primary)' }}>
                                                        <Mail size={12} style={{ color: 'var(--text-muted)' }} />
                                                        <span>{company.email}</span>
                                                    </div>
                                                )}
                                                {company.phone && (
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                                                        <Phone size={12} style={{ color: 'var(--text-muted)' }} />
                                                        <span>{company.phone}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}>
                                                <MapPin size={12} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                                                <span>{company.address || '—'}</span>
                                            </div>
                                        </td>
                                        <td>
                                            <span className={`badge ${company.status === 'Active' ? 'badge-approved' : 'badge-draft'}`}>
                                                {company.status}
                                            </span>
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                                <button
                                                    onClick={() => handleEdit(company)}
                                                    style={{
                                                        width: "38px",
                                                        height: "38px",
                                                        border: "none",
                                                        borderRadius: "8px",
                                                        background: "rgba(59, 130, 246, 0.12)",
                                                        color: "#3b82f6",
                                                        cursor: "pointer",
                                                        display: "flex",
                                                        alignItems: "center",
                                                        justifyContent: "center",
                                                        transition: "all 0.2s ease",
                                                    }}
                                                    onMouseEnter={(e) => {
                                                        e.currentTarget.style.background = "#3b82f6";
                                                        e.currentTarget.style.color = "#fff";
                                                        e.currentTarget.style.transform = "scale(1.05)";
                                                    }}
                                                    onMouseLeave={(e) => {
                                                        e.currentTarget.style.background = "rgba(59, 130, 246, 0.12)";
                                                        e.currentTarget.style.color = "#3b82f6";
                                                        e.currentTarget.style.transform = "scale(1)";
                                                    }}
                                                    title="Edit Company"
                                                >
                                                    <Edit size={18} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(company._id)}
                                                    disabled={isDeleting}
                                                    style={{
                                                        width: "38px",
                                                        height: "38px",
                                                        border: "none",
                                                        borderRadius: "8px",
                                                        background: "rgba(239, 68, 68, 0.12)",
                                                        color: "#ef4444",
                                                        cursor: "pointer",
                                                        display: "flex",
                                                        alignItems: "center",
                                                        justifyContent: "center",
                                                        transition: "all 0.2s ease",
                                                    }}
                                                    onMouseEnter={(e) => {
                                                        e.currentTarget.style.background = "#ef4444";
                                                        e.currentTarget.style.color = "#fff";
                                                        e.currentTarget.style.transform = "scale(1.05)";
                                                    }}
                                                    onMouseLeave={(e) => {
                                                        e.currentTarget.style.background = "rgba(239, 68, 68, 0.12)";
                                                        e.currentTarget.style.color = "#ef4444";
                                                        e.currentTarget.style.transform = "scale(1)";
                                                    }}
                                                    title="Delete Company"
                                                >
                                                    <Trash size={18} />
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

            {isModalOpen && (
                <AddCompanyModal isOpen={isModalOpen} onClose={handleClose} companyToEdit={companyToEdit} />
            )}
        </div>
    );
};

export default Company;