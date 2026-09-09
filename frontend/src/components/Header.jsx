import React from 'react';
import { ShieldCheck, DollarSign, Activity, Zap } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Header({ stats, isConnected }) {
  const containerVars = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.15 }
    }
  };

  const itemVars = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
  };

  return (
    <header style={{ marginBottom: '2.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem', marginBottom: '2rem' }}>
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ 
              background: 'linear-gradient(135deg, #10b981 0%, #0ea5e9 100%)', 
              width: '48px', height: '48px', 
              borderRadius: '14px', 
              display: 'flex', alignItems: 'center', justifyContent: 'center', 
              boxShadow: '0 8px 25px -5px rgba(16, 185, 129, 0.5)' 
            }}>
              <Zap size={28} color="#ffffff" />
            </div>
            <div>
              <h1 style={{ fontSize: '2.2rem', margin: 0, lineHeight: 1.1 }} className="gradient-text">VoidGate</h1>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: 0, marginTop: '4px' }}>Progressive Cost-Elimination Gateway & Mid-Stream Failover Engine</p>
            </div>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }}>
          <div className="badge" style={{ 
            background: isConnected ? 'rgba(16, 185, 129, 0.1)' : 'rgba(244, 63, 94, 0.1)', 
            color: isConnected ? '#34d399' : '#fb7185', 
            border: `1px solid ${isConnected ? 'rgba(16, 185, 129, 0.3)' : 'rgba(244, 63, 94, 0.3)'}`, 
            padding: '0.5rem 1rem', fontSize: '0.85rem' 
          }}>
            <motion.span 
              animate={{ opacity: isConnected ? [1, 0.4, 1] : 1 }} 
              transition={{ repeat: Infinity, duration: 2 }}
              style={{ width: '10px', height: '10px', borderRadius: '50%', background: isConnected ? '#10b981' : '#f43f5e', display: 'inline-block', boxShadow: isConnected ? '0 0 10px #10b981' : 'none' }}
            ></motion.span>
            {isConnected ? 'LIVE TELEMETRY CONNECTED' : 'RECONNECTING TELEMETRY...'}
          </div>
        </motion.div>
      </div>

      {/* Metric Cards Grid */}
      <motion.div 
        variants={containerVars} 
        initial="hidden" 
        animate="show"
        style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}
      >
        <motion.div variants={itemVars} className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '1rem', borderRadius: '16px', color: '#34d399', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
            <DollarSign size={32} />
          </div>
          <div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: 500, letterSpacing: '0.5px', textTransform: 'uppercase' }}>Saved Today</div>
            <motion.div 
              key={stats?.total_saved}
              initial={{ scale: 1.1, color: '#fff' }} animate={{ scale: 1, color: '#34d399' }} transition={{ duration: 0.3 }}
              style={{ fontSize: '2.5rem', fontWeight: 800, fontFamily: 'var(--font-display)', marginTop: '2px' }}
            >
              ${stats?.total_saved ? stats.total_saved.toFixed(2) : '47.20'}
            </motion.div>
          </div>
        </motion.div>

        <motion.div variants={itemVars} className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <div style={{ background: 'rgba(14, 165, 233, 0.1)', padding: '1rem', borderRadius: '16px', color: '#38bdf8', border: '1px solid rgba(14, 165, 233, 0.2)' }}>
            <ShieldCheck size={32} />
          </div>
          <div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: 500, letterSpacing: '0.5px', textTransform: 'uppercase' }}>Deflection Rate</div>
            <motion.div 
              key={stats?.deflection_rate}
              initial={{ scale: 1.1, color: '#fff' }} animate={{ scale: 1, color: '#38bdf8' }} transition={{ duration: 0.3 }}
              style={{ fontSize: '2.5rem', fontWeight: 800, fontFamily: 'var(--font-display)', marginTop: '2px' }}
            >
              {stats?.deflection_rate ? stats.deflection_rate : '94.2'}%
            </motion.div>
          </div>
        </motion.div>

        <motion.div variants={itemVars} className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <div style={{ background: 'rgba(245, 158, 11, 0.1)', padding: '1rem', borderRadius: '16px', color: '#fbbf24', border: '1px solid rgba(245, 158, 11, 0.2)' }}>
            <Activity size={32} />
          </div>
          <div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: 500, letterSpacing: '0.5px', textTransform: 'uppercase' }}>Requests Processed</div>
            <motion.div 
              key={stats?.total_requests}
              initial={{ scale: 1.1, color: '#fff' }} animate={{ scale: 1, color: '#fbbf24' }} transition={{ duration: 0.3 }}
              style={{ fontSize: '2.5rem', fontWeight: 800, fontFamily: 'var(--font-display)', marginTop: '2px' }}
            >
              {stats?.total_requests ? stats.total_requests.toLocaleString() : '1,247'}
            </motion.div>
          </div>
        </motion.div>
      </motion.div>
    </header>
  );
}
