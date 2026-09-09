import React, { useState } from 'react';
import { RefreshCw, AlertTriangle, ShieldCheck, Flame } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function PhoenixDemo() {
  const [isFailoverActive, setIsFailoverActive] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

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
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="glass-card" 
      style={{ 
        marginBottom: '2.5rem', 
        border: isFailoverActive ? '1px solid rgba(244, 63, 94, 0.5)' : '1px solid var(--border-color)',
        boxShadow: isFailoverActive ? '0 10px 40px -10px rgba(244, 63, 94, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.05)' : ''
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1.5rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
            <motion.div
              animate={{ rotate: isFailoverActive ? [0, 10, -10, 0] : 0, scale: isFailoverActive ? [1, 1.1, 1] : 1 }}
              transition={{ repeat: Infinity, duration: 1.5 }}
            >
              <Flame size={24} color={isFailoverActive ? "#f43f5e" : "#fb7185"} />
            </motion.div>
            <h3 style={{ fontSize: '1.3rem', margin: 0 }}>PhoenixProxy Mid-Stream Failover Simulator</h3>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: 0 }}>
            Simulate a cloud provider crash mid-response to watch PhoenixProxy perform seamless continuation.
          </p>
        </div>

        <button 
          className={`btn ${isFailoverActive ? 'btn-secondary' : ''}`}
          onClick={toggleFailover}
          disabled={isLoading}
          style={{ 
            background: isFailoverActive ? 'rgba(244, 63, 94, 0.15)' : 'linear-gradient(135deg, #f43f5e 0%, #e11d48 100%)', 
            color: isFailoverActive ? '#fb7185' : 'white', 
            border: isFailoverActive ? '1px solid rgba(244, 63, 94, 0.5)' : 'none',
            padding: '0.85rem 1.5rem'
          }}
        >
          {isFailoverActive ? <AlertTriangle size={18} /> : <ShieldCheck size={18} />}
          {isFailoverActive ? 'SIMULATED FAILOVER ACTIVE' : 'ENABLE SYNTHETIC FAILOVER'}
        </button>
      </div>

      <AnimatePresence>
        {isFailoverActive && (
          <motion.div 
            initial={{ opacity: 0, height: 0, marginTop: 0 }}
            animate={{ opacity: 1, height: 'auto', marginTop: '1.5rem' }}
            exit={{ opacity: 0, height: 0, marginTop: 0 }}
            style={{ overflow: 'hidden' }}
          >
            <div style={{ 
              background: 'rgba(244, 63, 94, 0.15)', 
              border: '1px solid rgba(244, 63, 94, 0.4)', 
              borderRadius: '12px', 
              padding: '1rem 1.25rem', 
              fontSize: '0.9rem', 
              color: '#fda4af', 
              display: 'flex', alignItems: 'center', gap: '0.75rem' 
            }}>
              <AlertTriangle size={18} />
              <span>Synthetic failure is active! Next cloud query sent via the Playground will simulate Provider A crashing at token #14.</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
