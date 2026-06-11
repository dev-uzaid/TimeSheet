import React, { useState } from 'react';
import { useGetEmployeesQuery, useDeleteEmployeeMutation } from '../../redux/services/employeeApi';
import AddEmployeeModal from '../../Modals/AddEmployeeModal';
import { getStoredUser } from '../../utils/api';
import { Users, Plus, Trash2 } from 'lucide-react';

const Employee = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const { data: employees, isLoading, isError } = useGetEmployeesQuery();
    const [deleteEmployee] = useDeleteEmployeeMutation();
    const currentUser = getStoredUser();

    const handleDelete = async (id) => {
        if (window.confirm("Are you sure you want to delete this employee?")) {
            try {
                await deleteEmployee(id).unwrap();
            } catch (err) {
                alert(`Error deleting employee: ${err.message || 'Unknown error'}`);
            }
        }
    };

    return (
        <div>
            {/* Header Controls */}
            <div className="glass-panel section-card" style={{ marginBottom: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Users size={24} style={{ color: 'var(--accent-primary)' }} />
                        <h2 style={{ fontSize: '1.25rem', margin: 0 }}>Employee Administration Desk</h2>
                    </div>
                    {currentUser?.role === 'admin' && (
                        <button 
                            className="btn btn-primary" 
                            style={{ height: '40px', padding: '0 16px', display: 'flex', alignItems: 'center', gap: '6px' }}
                            onClick={() => setIsModalOpen(true)}
                        >
                            <Plus size={18} />
                            Add Employee
                        </button>
                    )}
                </div>
            </div>

            {/* Employee Directory List */}
            <div className="glass-panel section-card">
                <div className="section-header">
                    <h3>System Employee Records ({employees?.length || 0})</h3>
                </div>

                <div className="table-wrapper">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Email Address</th>
                                <th>Organization Role</th>
                                <th>Reporting Manager</th>
                                {currentUser?.role === 'admin' && <th style={{ textAlign: 'right' }}>Actions</th>}
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading ? (
                                <tr>
                                    <td colSpan={currentUser?.role === 'admin' ? 5 : 4} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-secondary)' }}>
                                        Loading registered employees...
                                    </td>
                                </tr>
                            ) : isError ? (
                                <tr>
                                    <td colSpan={currentUser?.role === 'admin' ? 5 : 4} style={{ textAlign: 'center', padding: '32px', color: 'var(--danger)', fontWeight: 600 }}>
                                        Failed to load employee records. Please verify authorization.
                                    </td>
                                </tr>
                            ) : !employees || employees.length === 0 ? (
                                <tr>
                                    <td colSpan={currentUser?.role === 'admin' ? 5 : 4} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-secondary)' }}>
                                        No employees registered in the system.
                                    </td>
                                </tr>
                            ) : (
                                employees.map((emp) => (
                                    <tr key={emp._id}>
                                        <td style={{ fontWeight: 600 }}>{emp.name}</td>
                                        <td>{emp.email}</td>
                                        <td>
                                            <span className={`badge ${
                                                emp.role === 'admin' ? 'badge-rejected' : 
                                                emp.role === 'manager' ? 'badge-warning' : 'badge-success'
                                            }`}>
                                                {emp.role}
                                            </span>
                                        </td>
                                        <td>
                                            {emp.managerId ? (
                                                <div>
                                                    <span style={{ fontWeight: 500 }}>{emp.managerId.name}</span>
                                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{emp.managerId.email}</div>
                                                </div>
                                            ) : (
                                                <span style={{ color: 'var(--text-muted)' }}>None (Top Level)</span>
                                            )}
                                        </td>
                                        {currentUser?.role === 'admin' && (
                                            <td style={{ textAlign: 'right' }}>
                                                <button 
                                                    className="btn btn-danger btn-sm"
                                                    style={{ padding: '6px 12px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                                                    onClick={() => handleDelete(emp._id)}
                                                    disabled={emp._id === currentUser._id}
                                                    title={emp._id === currentUser._id ? "You cannot delete your own session account" : "Remove Employee"}
                                                >
                                                    <Trash2 size={14} />
                                                    Delete
                                                </button>
                                            </td>
                                        )}
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal */}
            {isModalOpen && (
                <AddEmployeeModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
            )}
        </div>
    );
};

export default Employee;