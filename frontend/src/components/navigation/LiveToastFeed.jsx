import React from 'react';
import { Activity, MapPin, Sparkles, CheckCircle2, ShieldAlert } from 'lucide-react';

export function LiveToastFeed({ toasts = [], onDismiss }) {
  if (!toasts || toasts.length === 0) return null;

  return (
    <div className="toast-container">
      {toasts.map((t) => (
        <div key={t.id} className="toast-message" onClick={() => onDismiss && onDismiss(t.id)}>
          {t.type === 'WORKER_LOCATION_UPDATE' && <Activity size={16} color="#1a73e8" />}
          {t.type === 'PROPERTY_CAPTURED' && <CheckCircle2 size={16} color="#188038" />}
          {t.type === 'MATCHING_COMPLETE' && <Sparkles size={16} color="#1a73e8" />}
          {t.type === 'CONFLICT_FLAGGED' && <ShieldAlert size={16} color="#d93025" />}
          
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-main)' }}>
              {t.title || 'Telemetry Update'}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
              {t.message}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
