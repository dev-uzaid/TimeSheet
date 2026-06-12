import React from 'react';
import { History, Search, Download, CheckCircle } from 'lucide-react';

export default function AssetHistory({
  history,
  historySearch,
  setHistorySearch,
  handleExportCSV
}) {
  return (
    <div className="tab-pane-content glass-panel section-card">
      <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', borderBottom: 'none', marginBottom: '16px' }}>
        <h3 style={{ marginBottom: 0 }}>
          <History size={20} style={{ color: 'var(--accent-primary)' }} />
          Asset Audit Movements Log (Chain of Custody)
        </h3>
        
        <div style={{ display: 'flex', gap: '12px' }}>
          <div style={{ position: 'relative' }}>
            <input 
              type="text" 
              className="form-control" 
              placeholder="Search Tag, Assignee..." 
              value={historySearch}
              onChange={(e) => setHistorySearch(e.target.value)}
              style={{ paddingLeft: '36px', height: '38px', width: '220px', fontSize: '0.85rem' }}
            />
            <Search size={14} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-muted)' }} />
          </div>

          <button onClick={() => handleExportCSV('movements')} className="btn btn-secondary btn-sm" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Download size={14} />
            Export logs (CSV)
          </button>
        </div>
      </div>

      <div className="table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th>Asset Info</th>
              <th>Assigned Holder</th>
              <th>Checkout Date</th>
              <th>Expected Return</th>
              <th>Actual Return</th>
              <th>Custody Conditions</th>
              <th>Remarks / Notes</th>
              <th>Audited By</th>
            </tr>
          </thead>
          <tbody>
            {history.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-secondary)' }}>
                  No asset checkout or check-in movements recorded yet.
                </td>
              </tr>
            ) : (
              history.map((log) => {
                const isOverdue = !log.actualReturnDate && new Date(log.expectedReturnDate) < new Date();
                return (
                  <tr key={log._id}>
                    <td>
                      <strong style={{ color: 'var(--accent-primary)', fontSize: '0.95rem' }}>{log.assetId?.assetTag || 'AST-DEL'}</strong>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{log.assetId?.configId?.brand} {log.assetId?.configId?.modelName}</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>S/N: {log.assetId?.serialNumber}</div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{log.employeeId?.name || 'N/A'}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{log.employeeId?.email}</div>
                    </td>
                    <td>{new Date(log.checkoutDate).toLocaleDateString()}</td>
                    <td style={{ color: isOverdue ? 'var(--danger)' : 'var(--text-primary)', fontWeight: isOverdue ? 700 : 500 }}>
                      {new Date(log.expectedReturnDate).toLocaleDateString()}
                    </td>
                    <td>
                      {log.actualReturnDate ? (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--success)' }}>
                          <CheckCircle size={14} />
                          {new Date(log.actualReturnDate).toLocaleDateString()}
                        </span>
                      ) : (
                        <span className={`badge ${isOverdue ? 'badge-rejected animate-pulse' : 'badge-submitted'}`} style={{ fontSize: '0.7rem' }}>
                          {isOverdue ? 'Overdue Return' : 'In Possession'}
                        </span>
                      )}
                    </td>
                    <td style={{ fontSize: '0.8rem' }}>
                      <div><strong>Issued:</strong> {log.checkoutCondition}</div>
                      {log.actualReturnDate && <div><strong>Returned:</strong> {log.returnCondition}</div>}
                    </td>
                    <td style={{ fontSize: '0.8rem', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={log.remarks}>
                      {log.remarks || '-'}
                    </td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      <div><strong>Out:</strong> {log.createdBy?.name || 'System'}</div>
                      {log.actualReturnDate && log.updatedBy && <div><strong>In:</strong> {log.updatedBy?.name}</div>}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
