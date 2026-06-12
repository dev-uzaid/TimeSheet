import React from 'react';
import { Cpu, Plus, Edit, Trash2 } from 'lucide-react';

export default function HardwareCatalog({
  configs,
  isAdmin,
  handleOpenEditConfig,
  handleDeleteConfig,
  handleOpenCreateConfig
}) {
  return (
    <div className="tab-pane-content glass-panel section-card">
      <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: 'none', marginBottom: '16px' }}>
        <h3 style={{ marginBottom: 0 }}>
          <Cpu size={20} style={{ color: 'var(--accent-primary)' }} />
          Reusable Hardware Templates Catalog
        </h3>
        {isAdmin && (
          <button onClick={handleOpenCreateConfig} className="btn btn-primary btn-sm">
            <Plus size={16} />
            Add New Template
          </button>
        )}
      </div>

      <div className="table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th>Brand</th>
              <th>Model Name</th>
              <th>Device Type</th>
              <th>Processor (CPU)</th>
              <th>Memory (RAM)</th>
              <th>Storage</th>
              <th>Graphics (GPU)</th>
              <th>OS</th>
              <th>Warranty Specs</th>
              {isAdmin && <th style={{ textAlign: 'right' }}>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {configs.length === 0 ? (
              <tr>
                <td colSpan={10} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-secondary)' }}>
                  No hardware configuration templates found in the catalog database.
                </td>
              </tr>
            ) : (
              configs.map((config) => (
                <tr key={config._id}>
                  <td style={{ fontWeight: 700 }}>{config.brand}</td>
                  <td style={{ fontWeight: 600, color: 'var(--accent-primary)' }}>{config.modelName}</td>
                  <td>
                    <span className="badge badge-info" style={{ textTransform: 'uppercase', fontSize: '0.7rem' }}>
                      {config.deviceType}
                    </span>
                  </td>
                  <td>{config.cpu}</td>
                  <td>{config.ram}</td>
                  <td>{config.storage}</td>
                  <td style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{config.graphicsCard}</td>
                  <td style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{config.operatingSystem}</td>
                  <td style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{config.warrantyInfo || 'Standard'}</td>
                  {isAdmin && (
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                        <button onClick={() => handleOpenEditConfig(config)} className="btn btn-secondary btn-sm" style={{ padding: '6px', borderRadius: '4px' }}>
                          <Edit size={14} />
                        </button>
                        <button onClick={() => handleDeleteConfig(config._id)} className="btn btn-danger btn-sm" style={{ padding: '6px', borderRadius: '4px' }}>
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
