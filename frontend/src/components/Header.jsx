import React from 'react';
import { ShieldCheck, DollarSign, Activity, Zap } from 'lucide-react';

export default function Header({ stats, isConnected }) {
  return (
    <header style={{ marginBottom: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ background: 'linear-gradient(135deg, #10b981 0%, #3b82f6 100%)', width: '42px', height: '42px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 20px rgba(16, 185, 129, 0.4)' }}>
              <Zap size={24} color="#ffffff" />
            </div>
            <div>
              <h1 style={{ fontSize: '1.85rem', fontWeight: 800 }}>VoidGate</h1>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>Progressive Cost-Elimination Gateway & Mid-Stream Failover Engine</p>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div className="badge" style={{ background: isConnected ? 'rgba(16, 185, 129, 0.12)' : 'rgba(244, 63, 94, 0.12)', color: isConnected ? '#34d399' : '#fb7185', border: `1px solid ${isConnected ? 'rgba(16, 185, 129, 0.3)' : 'rgba(244, 63, 94, 0.3)'}`, padding: '0.4rem 0.85rem', fontSize: '0.82rem' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: isConnected ? '#10b981' : '#f43f5e', display: 'inline-block', boxShadow: isConnected ? '0 0 8px #10b981' : 'none' }}></span>
            {isConnected ? 'LIVE TELEMETRY CONNECTED' : 'RECONNECTING TELEMETRY...'}
          </div>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.25rem' }}>
        <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <div style={{ background: 'rgba(16, 185, 129, 0.15)', padding: '0.9rem', borderRadius: '12px', color: '#34d399' }}>
            <DollarSign size={28} />
          </div>
          <div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 500 }}>Saved Today</div>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: '#34d399' }}>${stats?.total_saved ? stats.total_saved.toFixed(2) : '47.20'}</div>
          </div>
        </div>

        <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <div style={{ background: 'rgba(59, 130, 246, 0.15)', padding: '0.9rem', borderRadius: '12px', color: '#60a5fa' }}>
            <ShieldCheck size={28} />
          </div>
          <div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 500 }}>Deflection Rate</div>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: '#60a5fa' }}>{stats?.deflection_rate ? stats.deflection_rate : '94.2'}%</div>
          </div>
        </div>

        <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <div style={{ background: 'rgba(245, 158, 11, 0.15)', padding: '0.9rem', borderRadius: '12px', color: '#fbbf24' }}>
            <Activity size={28} />
          </div>
          <div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 500 }}>Requests Processed</div>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: '#fbbf24' }}>{stats?.total_requests ? stats.total_requests.toLocaleString() : '1,247'}</div>
          </div>
        </div>
      </div>
    </header>
  );
}
