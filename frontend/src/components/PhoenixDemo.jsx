import React, { useState } from 'react';
import { RefreshCw, AlertTriangle, ShieldCheck, Flame } from 'lucide-react';

export default function PhoenixDemo() {
  const [isFailoverActive, setIsFailoverActive] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [failoverLog, setFailoverLog] = useState('');

  const toggleFailover = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/simulate_failure', { method: 'POST' });
      const data = await res.json();
      setIsFailoverActive(data.simulate_failover);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="glass-card" style={{ marginBottom: '2rem', border: isFailoverActive ? '1px solid rgba(244, 63, 94, 0.4)' : '1px solid var(--border-color)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <Flame size={20} color="#f43f5e" />
            <h3 style={{ fontSize: '1.1rem' }}>PhoenixProxy Mid-Stream Failover Simulator</h3>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>
            Simulate a cloud provider crash mid-response to watch PhoenixProxy perform seamless continuation.
          </p>
        </div>

        <button 
          className={`btn ${isFailoverActive ? 'btn-secondary' : ''}`}
          onClick={toggleFailover}
          disabled={isLoading}
          style={{ background: isFailoverActive ? 'rgba(244, 63, 94, 0.2)' : 'linear-gradient(135deg, #f43f5e 0%, #e11d48 100%)', color: isFailoverActive ? '#fb7185' : 'white', border: isFailoverActive ? '1px solid rgba(244, 63, 94, 0.4)' : 'none' }}
        >
          {isFailoverActive ? <AlertTriangle size={16} color="#fb7185" /> : <ShieldCheck size={16} />}
          {isFailoverActive ? 'SIMULATED FAILOVER ACTIVE' : 'ENABLE SYNTHETIC FAILOVER'}
        </button>
      </div>

      {isFailoverActive && (
        <div style={{ marginTop: '1rem', background: 'rgba(244, 63, 94, 0.1)', border: '1px solid rgba(244, 63, 94, 0.25)', borderRadius: '8px', padding: '0.75rem 1rem', fontSize: '0.82rem', color: '#fda4af', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <AlertTriangle size={16} />
          <span>Synthetic failure is active! Next cloud query sent via the Playground will simulate Provider A crashing at token #14.</span>
        </div>
      )}
    </div>
  );
}
