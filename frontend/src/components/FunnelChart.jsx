import React from 'react';
import { Layers, Clock } from 'lucide-react';
import { motion } from 'framer-motion';

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
    { key: 'L3 Local SLM', name: 'L3: Local SLM Router', color: '#0ea5e9', latency: '~50ms', desc: 'Ollama Phi-3 / Qwen2 local inference (~$0)' },
    { key: 'L4 Context Dedup', name: 'L4: Context Deduplication', color: '#8b5cf6', latency: '< 1ms', desc: 'Strips repeated system prompt tokens' },
    { key: 'L5 Cloud', name: 'L5: Cloud + PhoenixProxy', color: '#f43f5e', latency: '1-3s', desc: 'Frontier Cloud LLMs with mid-stream failover' }
  ];

  return (
    <div className="glass-card" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ background: 'rgba(52, 211, 153, 0.1)', padding: '8px', borderRadius: '10px' }}>
            <Layers size={22} color="#34d399" />
          </div>
          <h3 style={{ fontSize: '1.25rem', margin: 0 }}>5-Layer Deflection Funnel</h3>
        </div>
        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(255,255,255,0.05)', padding: '4px 10px', borderRadius: '20px' }}>
          <Clock size={14} /> Overhead: ~22ms total
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', flex: 1 }}>
        {layersInfo.map((layer, i) => {
          const pct = data[layer.key] || 0;
          return (
            <motion.div 
              key={layer.key}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 + 0.2 }}
              style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', fontSize: '0.95rem' }}>
                <span style={{ fontWeight: 600, color: layer.color, display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  {layer.name}
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontWeight: 500, display: 'inline-flex', alignItems: 'center', gap: '0.3rem', background: 'rgba(255,255,255,0.05)', padding: '2px 6px', borderRadius: '4px' }}>
                    <Clock size={12} /> {layer.latency}
                  </span>
                </span>
                <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '1.1rem', color: '#fff' }}>{pct}%</span>
              </div>

              {/* Progress Bar Container */}
              <div style={{ width: '100%', height: '12px', background: 'rgba(0, 0, 0, 0.3)', borderRadius: '8px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.05)' }}>
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.max(pct, 2)}%` }}
                  transition={{ duration: 1, delay: i * 0.1 + 0.5, ease: "easeOut" }}
                  style={{ 
                    height: '100%', 
                    background: `linear-gradient(90deg, ${layer.color}88, ${layer.color})`, 
                    borderRadius: '8px',
                    boxShadow: `0 0 12px ${layer.color}66`
                  }} 
                />
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-dim)', marginTop: '2px' }}>{layer.desc}</div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
