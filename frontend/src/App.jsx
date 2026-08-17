import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import FunnelChart from './components/FunnelChart';
import LiveFeed from './components/LiveFeed';
import Playground from './components/Playground';
import PhoenixDemo from './components/PhoenixDemo';

export default function App() {
  const [stats, setStats] = useState({
    total_requests: 1247,
    total_saved: 47.20,
    deflection_rate: 94.2,
    layer_breakdown: {
      'L1 Exact Cache': 78.3,
      'L2 Semantic Cache': 9.5,
      'L3 Local SLM': 4.2,
      'L4 Context Dedup': 1.5,
      'L5 Cloud': 6.5
    }
  });

  const [logs, setLogs] = useState([]);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Fetch initial REST stats
    fetch('/api/stats')
      .then(res => res.json())
      .then(data => setStats(data))
      .catch(err => console.error(err));

    fetch('/api/logs')
      .then(res => res.json())
      .then(data => setLogs(data))
      .catch(err => console.error(err));

    // Connect WebSocket stream
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      setIsConnected(true);
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === 'INIT') {
          if (msg.stats) setStats(msg.stats);
          if (msg.logs) setLogs(msg.logs);
        } else if (msg.type === 'NEW_REQUEST') {
          if (msg.stats) setStats(msg.stats);
          if (msg.log) {
            setLogs(prev => [msg.log, ...prev.slice(0, 25)]);
          }
        }
      } catch (e) {
        console.error('WS Parse Error', e);
      }
    };

    ws.onclose = () => {
      setIsConnected(false);
    };

    return () => {
      ws.close();
    };
  }, []);

  return (
    <div className="app-container">
      <Header stats={stats} isConnected={isConnected} />
      
      <PhoenixDemo />

      <Playground />

      {/* Grid Dashboard Section */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        <FunnelChart layerBreakdown={stats?.layer_breakdown} />
        <LiveFeed logs={logs} />
      </div>

      <footer style={{ textAlign: 'center', color: 'var(--text-dim)', fontSize: '0.8rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border-color)' }}>
        VoidGate Progressive Cost-Elimination Gateway & Mid-Stream Failover Engine — Project Expo 2026
      </footer>
    </div>
  );
}
