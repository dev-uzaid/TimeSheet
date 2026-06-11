import React from 'react';
import { Mail, MailOpen, CheckCheck, Inbox, Clock } from 'lucide-react';

export default function NotificationInbox({ notifications, onMarkRead, onMarkAllRead, loading }) {
  const formatTime = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleString();
  };

  return (
    <div className="glass-panel section-card">
      <div className="section-header">
        <h3>
          <Inbox size={20} />
          In-App Email Alerts Center
        </h3>
        {notifications.some(n => !n.read) && (
          <button onClick={onMarkAllRead} className="btn btn-secondary btn-sm">
            <CheckCheck size={16} />
            Mark All as Read
          </button>
        )}
      </div>

      {loading ? (
        <p className="stat-desc" style={{ textAlign: 'center', padding: '32px' }}>Loading alerts...</p>
      ) : notifications.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px 24px', color: 'var(--text-secondary)' }}>
          <Inbox size={48} style={{ opacity: 0.3, marginBottom: '16px' }} />
          <p>No notifications or alert emails dispatched yet.</p>
        </div>
      ) : (
        <div className="inbox-list">
          {notifications.map((notif) => (
            <div key={notif._id} className={`glass-panel inbox-item ${notif.read ? '' : 'unread'}`}>
              <div className="inbox-icon">
                {notif.read ? <MailOpen size={20} /> : <Mail size={20} />}
              </div>
              <div className="inbox-details">
                <div className="inbox-meta">
                  <h4 className="inbox-title">{notif.title}</h4>
                  <span className="inbox-time">
                    <Clock size={12} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
                    {formatTime(notif.createdAt)}
                  </span>
                </div>
                <p className="inbox-body">{notif.body}</p>
                {!notif.read && (
                  <div className="inbox-actions">
                    <button 
                      onClick={() => onMarkRead(notif._id)} 
                      className="btn btn-secondary btn-sm"
                      style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                    >
                      Mark as Read
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
