import React from 'react';
import { Radio, Zap, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <motion.div animate={{ opacity: [1, 0.4, 1] }} transition={{ repeat: Infinity, duration: 2 }}>
            <Radio size={22} color="#0ea5e9" />
          </motion.div>
          <h3 style={{ fontSize: '1.25rem', margin: 0 }}>Live Request Feed</h3>
        </div>
        <span className="badge" style={{ background: 'rgba(14, 165, 233, 0.15)', color: '#38bdf8', border: '1px solid rgba(14, 165, 233, 0.3)' }}>STREAMING WS</span>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', maxHeight: '450px', display: 'flex', flexDirection: 'column', gap: '1rem', paddingRight: '0.5rem' }}>
        <AnimatePresence>
          {logs && logs.length > 0 ? (
            logs.map((log, idx) => (
              <motion.div 
                key={log.id || idx} 
                initial={{ opacity: 0, x: -20, height: 0 }}
                animate={{ opacity: 1, x: 0, height: 'auto' }}
                transition={{ type: "spring", stiffness: 300, damping: 24 }}
                style={{ background: 'rgba(2, 6, 23, 0.5)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '1rem 1.25rem', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className={`badge ${getBadgeClass(log.layer)}`}>
                    {log.layer}
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    <span style={{ fontFamily: 'var(--font-mono)' }}>{log.latency_ms}ms</span>
                    {log.saved_cost > 0 && (
                      <span style={{ color: '#34d399', fontWeight: 600, fontFamily: 'var(--font-mono)' }}>
                        +${log.saved_cost.toFixed(3)}
                      </span>
                    )}
                  </div>
                </div>

                <div style={{ fontSize: '0.95rem', color: 'var(--text-main)', fontFamily: 'var(--font-mono)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  POST /v1/chat/completions — <span style={{ color: 'var(--text-muted)' }}>"{log.prompt}"</span>
                </div>

                {log.failover_events > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.82rem', color: '#fb7185', background: 'rgba(244, 63, 94, 0.1)', padding: '0.4rem 0.75rem', borderRadius: '6px', marginTop: '0.25rem' }}>
                    <AlertTriangle size={16} />
                    <span>PhoenixProxy Failover: Claude 3.5 → GPT-4o (+200ms)</span>
                  </div>
                )}
              </motion.div>
            ))
          ) : (
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              style={{ textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-dim)', textAlign: 'center', padding: '4rem 1rem', fontSize: '0.9rem' }}
            >
              Waiting for requests... Use the Playground to send test prompts!
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
