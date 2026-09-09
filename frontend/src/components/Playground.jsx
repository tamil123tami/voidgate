import React, { useState, useRef, useEffect } from 'react';
import { Send, Zap, RotateCcw, CheckCircle, ArrowRight, Trash2, User, Bot } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Playground() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [lastMeta, setLastMeta] = useState(null);
  const chatContainerRef = useRef(null);

  const presets = [
    { label: 'Exact Repeat (L1)', text: 'explain async/await in Python' },
    { label: 'Rephrased Query (L2)', text: 'how does async await work in python?' },
    { label: 'Simple Task (L3)', text: 'format this as JSON: name=VoidGate status=active' },
    { label: 'Complex Coding (L5)', text: 'refactor this 200-line function and fix race condition in asyncio loop' }
  ];

  // Auto-scroll only the chat container to bottom without window jitter
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const renderMessageContent = (content) => {
    if (!content) return null;
    
    // Split text by code blocks first
    const codeBlockRegex = /```([\s\S]*?)```/g;
    const parts = [];
    let lastIndex = 0;
    let match;
    
    while ((match = codeBlockRegex.exec(content)) !== null) {
      const textBefore = content.substring(lastIndex, match.index);
      if (textBefore) {
        parts.push({ type: 'text', content: textBefore });
      }
      parts.push({ type: 'codeblock', content: match[1] });
      lastIndex = codeBlockRegex.lastIndex;
    }
    
    const remainingText = content.substring(lastIndex);
    if (remainingText) {
      parts.push({ type: 'text', content: remainingText });
    }
    
    return parts.map((part, idx) => {
      if (part.type === 'codeblock') {
        return (
          <pre key={idx} style={{ 
            background: 'rgba(0,0,0,0.5)', 
            padding: '0.75rem', 
            borderRadius: '8px', 
            overflowX: 'auto',
            fontFamily: 'var(--font-mono)',
            fontSize: '0.85rem',
            margin: '0.5rem 0',
            border: '1px solid rgba(255,255,255,0.05)',
            color: '#a7f3d0'
          }}>
            <code>{part.content}</code>
          </pre>
        );
      }
      
      // Parse inline formats in text: bold/italic combinations, bold, italic, inline code
      const inlineRegex = /(\*\*\*.*?\*\*\*|\*\*.*?\*\*|\*.*?\*|`.*?`)/g;
      const subParts = part.content.split(inlineRegex);
      
      return (
        <span key={idx}>
          {subParts.map((subPart, sIdx) => {
            if (subPart.startsWith('***') && subPart.endsWith('***')) {
              return <strong key={sIdx}><em>{subPart.slice(3, -3)}</em></strong>;
            }
            if (subPart.startsWith('**') && subPart.endsWith('**')) {
              return <strong key={sIdx}>{subPart.slice(2, -2)}</strong>;
            }
            if (subPart.startsWith('*') && subPart.endsWith('*')) {
              return <em key={sIdx}>{subPart.slice(1, -1)}</em>;
            }
            if (subPart.startsWith('`') && subPart.endsWith('`')) {
              return (
                <code key={sIdx} style={{ 
                  background: 'rgba(255,255,255,0.1)', 
                  padding: '0.15rem 0.3rem', 
                  borderRadius: '4px',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.85rem',
                  color: '#fda4af'
                }}>
                  {subPart.slice(1, -1)}
                </code>
              );
            }
            return subPart;
          })}
        </span>
      );
    });
  };

  const handleSend = async (overridePrompt) => {
    const query = overridePrompt || input;
    if (!query.trim()) return;

    setIsLoading(true);
    setLastMeta(null);
    setInput(''); // Clear input

    // Create the new messages array to send
    const updatedMessages = [...messages, { role: 'user', content: query }];
    
    // Add an empty assistant message to stream into
    setMessages([...updatedMessages, { role: 'assistant', content: '' }]);

    const startTime = performance.now();

    try {
      const res = await fetch('/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'gpt-4o',
          messages: updatedMessages, // Send FULL history so it remembers context
          stream: true
        })
      });

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let fullText = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ') && line !== 'data: [DONE]') {
            try {
              const data = JSON.parse(line.substring(6));
              const content = data.choices[0]?.delta?.content || '';
              fullText += content;
              
              // Update the LAST message in the state with the streaming text
              setMessages(prev => {
                const newArr = [...prev];
                newArr[newArr.length - 1].content = fullText;
                return newArr;
              });
            } catch (e) {
              // Parse fallback
            }
          }
        }
      }

      const elapsed = Math.round(performance.now() - startTime);

      const hitLayer = res.headers.get('X-VoidGate-Layer') || 'L5 Cloud';
      let costSaved = 0.0;
      if (hitLayer === 'L1 Exact Cache' || hitLayer === 'L2 Semantic Cache') {
        costSaved = 0.015;
      } else if (hitLayer === 'L3 Local SLM') {
        costSaved = 0.012;
      } else if (hitLayer.startsWith('L4') || hitLayer.includes('Dedup')) {
        costSaved = 0.005;
      }

      setLastMeta({ layer: hitLayer, latency: elapsed, costSaved });

    } catch (err) {
      setMessages(prev => {
        const newArr = [...prev];
        newArr[newArr.length - 1].content = 'Error executing query: ' + err.message;
        return newArr;
      });
    } finally {
      setIsLoading(false);
    }
  };

  const resetChat = () => {
    setMessages([]);
    setLastMeta(null);
    setInput('');
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="glass-card" style={{ marginBottom: '2.5rem', display: 'flex', flexDirection: 'column' }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Zap size={24} color="#fbbf24" />
          <h3 style={{ fontSize: '1.3rem', margin: 0 }}>Interactive Gateway Playground</h3>
        </div>
        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Test caching and failover with full context</span>
      </div>

      {/* Preset Quick Buttons */}
      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
        {presets.map((p, idx) => (
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            key={idx} 
            className="btn btn-secondary" 
            style={{ fontSize: '0.82rem', padding: '0.45rem 1rem', borderRadius: '10px' }}
            onClick={() => handleSend(p.text)}
          >
            {p.label} <ArrowRight size={14} />
          </motion.button>
        ))}
      </div>

      {/* Chat History Container */}
      <div ref={chatContainerRef} style={{ 
        background: 'rgba(2, 6, 23, 0.7)', 
        border: '1px solid var(--border-color)', 
        borderRadius: '12px', 
        padding: '1.25rem', 
        marginBottom: '1rem',
        height: '350px', 
        overflowY: 'auto', 
        boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.3)',
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem'
      }}>
        {messages.length === 0 ? (
          <div style={{ margin: 'auto', color: 'var(--text-dim)', fontSize: '0.9rem', textAlign: 'center' }}>
            No messages yet. Send a prompt below to start a conversation!
          </div>
        ) : (
          messages.map((msg, idx) => (
            <motion.div 
              key={idx}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              style={{ 
                display: 'flex', 
                flexDirection: msg.role === 'user' ? 'row-reverse' : 'row',
                gap: '0.75rem',
                alignItems: 'flex-start'
              }}
            >
              <div style={{ 
                background: msg.role === 'user' ? 'rgba(14, 165, 233, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                padding: '0.5rem',
                borderRadius: '8px',
                color: msg.role === 'user' ? '#38bdf8' : '#34d399'
              }}>
                {msg.role === 'user' ? <User size={18} /> : <Bot size={18} />}
              </div>
              <div style={{ 
                background: msg.role === 'user' ? 'rgba(14, 165, 233, 0.1)' : 'rgba(255, 255, 255, 0.03)', 
                border: msg.role === 'user' ? '1px solid rgba(14, 165, 233, 0.2)' : '1px solid var(--border-color)',
                padding: '0.75rem 1rem', 
                borderRadius: '12px', 
                borderTopRightRadius: msg.role === 'user' ? 0 : '12px',
                borderTopLeftRadius: msg.role === 'assistant' ? 0 : '12px',
                maxWidth: '85%',
                fontSize: '0.9rem', 
                fontFamily: msg.role === 'assistant' ? 'var(--font-mono)' : 'var(--font-sans)',
                color: '#e2e8f0',
                whiteSpace: 'pre-wrap',
                lineHeight: '1.5'
              }}>
                {msg.content ? renderMessageContent(msg.content) : <span className="pulse">Typing...</span>}
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Input & Controls */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
        <input 
          type="text" 
          className="input-field" 
          value={input} 
          onChange={(e) => setInput(e.target.value)} 
          placeholder="Ask a follow up question..."
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          disabled={isLoading}
        />
        <motion.button 
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          className="btn" onClick={() => handleSend()} disabled={isLoading || !input.trim()}
          style={{ minWidth: '130px', justifyContent: 'center' }}
        >
          {isLoading ? <RotateCcw size={18} className="pulse" /> : <Send size={18} />}
          {isLoading ? 'Routing' : 'Send'}
        </motion.button>
      </div>

      {/* Result Display & Funnel Routing Telemetry - Fixed Height Slot to Prevent Layout Shifting */}
      <div style={{ height: '60px', marginBottom: '1rem', display: 'flex', alignItems: 'center' }}>
        <AnimatePresence>
          {lastMeta && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              style={{ width: '100%', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '12px', padding: '0.75rem 1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.95rem' }}>
                <CheckCircle size={20} color="#34d399" />
                <span>Deflection Result: <strong>{lastMeta.layer}</strong></span>
              </div>
              <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.9rem', fontFamily: 'var(--font-mono)' }}>
                <span>Latency: {lastMeta.latency}ms</span>
                <span style={{ color: '#34d399', fontWeight: 600 }}>Saved: +${lastMeta.costSaved.toFixed(3)}</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Reset Chat Button at the very bottom */}
      <div style={{ display: 'flex', justifyContent: 'center', marginTop: 'auto', paddingTop: '1rem' }}>
        <motion.button 
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="btn btn-secondary" 
          onClick={resetChat} 
          disabled={messages.length === 0 || isLoading}
          style={{ 
            color: messages.length === 0 ? 'var(--text-dim)' : '#fb7185',
            borderColor: messages.length === 0 ? 'transparent' : 'rgba(244, 63, 94, 0.3)',
            background: messages.length === 0 ? 'transparent' : 'rgba(244, 63, 94, 0.05)',
            fontSize: '0.85rem',
            padding: '0.5rem 1rem'
          }}
        >
          <Trash2 size={16} />
          Reset Chat History
        </motion.button>
      </div>

    </motion.div>
  );
}
