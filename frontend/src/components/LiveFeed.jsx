import React from 'react';
import { Radio, Zap, AlertTriangle } from 'lucide-react';

export default function LiveFeed({ logs }) {
  const getBadgeClass = (layer) => {
    if (layer?.includes('L1')) return 'badge-l1';
    if (layer?.includes('L2')) return 'badge-l2';
    if (layer?.includes('L3')) return 'badge-l3';
    if (layer?.includes('L4')) return 'badge-l4';
    return 'badge-l5';
  };

  return (
    <div className="glass-card" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Radio size={20} color="#60a5fa" className="pulse" />
          <h3 style={{ fontSize: '1.1rem' }}>Live Request Feed</h3>
        </div>
        <span className="badge badge-l1" style={{ fontSize: '0.72rem' }}>STREAMING WS</span>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', maxHeight: '380px', display: 'flex', flexDirection: 'column', gap: '0.75rem', paddingRight: '0.25rem' }}>
        {logs && logs.length > 0 ? (
          logs.map((log, idx) => (
            <div key={log.id || idx} style={{ background: 'rgba(15, 23, 42, 0.6)', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '0.85rem 1rem', display: 'flex', flexDirection: 'column', gap: '0.4rem', transition: 'all 0.2s ease' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className={`badge ${getBadgeClass(log.layer)}`}>
                  {log.layer}
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  <span style={{ fontFamily: 'var(--font-mono)' }}>{log.latency_ms}ms</span>
                  {log.saved_cost > 0 && (
                    <span style={{ color: '#34d399', fontWeight: 600, fontFamily: 'var(--font-mono)' }}>
                      +${log.saved_cost.toFixed(3)}
                    </span>
                  )}
                </div>
              </div>

              <div style={{ fontSize: '0.86rem', color: 'var(--text-main)', fontFamily: 'var(--font-mono)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                POST /v1/chat/completions — <span style={{ color: 'var(--text-muted)' }}>"{log.prompt}"</span>
              </div>

              {log.failover_events > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem', color: '#fb7185', background: 'rgba(244, 63, 94, 0.1)', padding: '0.2rem 0.5rem', borderRadius: '4px', marginTop: '0.2rem' }}>
                  <AlertTriangle size={14} />
                  <span>PhoenixProxy Failover: Claude 3.5 → GPT-4o (+200ms)</span>
                </div>
              )}
            </div>
          ))
        ) : (
          <div style={{ textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-dim)', textAlign: 'center', padding: '3rem 1rem', fontSize: '0.85rem' }}>
            Waiting for requests... Use the Playground to send test prompts!
          </div>
        )}
      </div>
    </div>
  );
}
