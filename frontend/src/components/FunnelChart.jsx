import React from 'react';
import { Layers, Clock } from 'lucide-react';

export default function FunnelChart({ layerBreakdown }) {
  const defaultBreakdown = {
    'L1 Exact Cache': 78.3,
    'L2 Semantic Cache': 9.5,
    'L3 Local SLM': 4.2,
    'L4 Context Dedup': 1.5,
    'L5 Cloud': 6.5
  };

  const data = layerBreakdown || defaultBreakdown;

  const layersInfo = [
    { key: 'L1 Exact Cache', name: 'L1: Exact Hash Cache', color: '#10b981', latency: '< 1ms', desc: 'SHA-256 Redis hash lookup ($0 cost)' },
    { key: 'L2 Semantic Cache', name: 'L2: Semantic Cache', color: '#f59e0b', latency: '~14ms', desc: 'MiniLM-L6-v2 FAISS vector search ($0 cost)' },
    { key: 'L3 Local SLM', name: 'L3: Local SLM Router', color: '#3b82f6', latency: '~50ms', desc: 'Ollama Phi-3 / Qwen2 local inference (~$0)' },
    { key: 'L4 Context Dedup', name: 'L4: Context Deduplication', color: '#8b5cf6', latency: '< 1ms', desc: 'Strips repeated system prompt tokens' },
    { key: 'L5 Cloud', name: 'L5: Cloud + PhoenixProxy', color: '#f43f5e', latency: '1-3s', desc: 'Frontier Cloud LLMs with mid-stream failover' }
  ];

  return (
    <div className="glass-card" style={{ height: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Layers size={20} color="#34d399" />
          <h3 style={{ fontSize: '1.1rem' }}>5-Layer Deflection Funnel</h3>
        </div>
        <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Overhead: ~22ms total</span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {layersInfo.map(layer => {
          const pct = data[layer.key] || 0;
          return (
            <div key={layer.key} style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.88rem' }}>
                <span style={{ fontWeight: 600, color: layer.color, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  {layer.name}
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontWeight: 400, display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}>
                    <Clock size={12} /> {layer.latency}
                  </span>
                </span>
                <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>{pct}%</span>
              </div>

              {/* Progress Bar Container */}
              <div style={{ width: '100%', height: '10px', background: 'rgba(255, 255, 255, 0.06)', borderRadius: '6px', overflow: 'hidden', position: 'relative' }}>
                <div 
                  style={{ 
                    width: `${Math.max(pct, 2)}%`, 
                    height: '100%', 
                    background: layer.color, 
                    borderRadius: '6px',
                    transition: 'width 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
                    boxShadow: `0 0 10px ${layer.color}`
                  }} 
                />
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>{layer.desc}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
