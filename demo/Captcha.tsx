import React, { useState, useEffect, useRef } from 'react';

// API Configuration
const API_BASE = 'http://localhost:3001/api';

// Types
interface CaptchaChallenge {
  id: string;
  targetName: string;
  images: string[];
}

interface TracePoint {
  x: number;
  y: number;
  t: number;
}

export const BangCaptcha: React.FC<{
  onSuccess?: (token: string) => void;
  onFail?: (msg: string) => void;
}> = ({ onSuccess, onFail }) => {
  const [challenge, setChallenge] = useState<CaptchaChallenge | null>(null);
  const [selectedIndexes, setSelectedIndexes] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  
  // Track mouse movements for bot prevention
  const traceData = useRef<TracePoint[]>([]);
  const captchaRef = useRef<HTMLDivElement>(null);

  const fetchCaptcha = async () => {
    try {
      setLoading(true);
      setErrorMsg('');
      setSelectedIndexes([]);
      traceData.current = [];
      
      const response = await fetch(`${API_BASE}/captcha`);
      if (!response.ok) throw new Error('Failed to fetch captcha');
      
      const data = await response.json();
      setChallenge(data);
    } catch (error) {
      console.error(error);
      setErrorMsg('验证码加载失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCaptcha();
  }, []);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!captchaRef.current) return;
    const rect = captchaRef.current.getBoundingClientRect();
    traceData.current.push({
      x: Math.round(e.clientX - rect.left),
      y: Math.round(e.clientY - rect.top),
      t: Date.now()
    });
  };

  const toggleSelect = (index: number) => {
    setSelectedIndexes(prev => 
      prev.includes(index)
        ? prev.filter(i => i !== index)
        : [...prev, index]
    );
  };

  const handleVerify = async () => {
    if (!challenge || selectedIndexes.length === 0) return;
    
    try {
      setVerifying(true);
      setErrorMsg('');
      
      // Format trace data to match backend [timestamp, x, y] format
      const formattedTrace = traceData.current.map(p => [p.t, p.x, p.y]);
      
      const response = await fetch(`${API_BASE}/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: challenge.id,
          selectedIndexes,
          traceData: formattedTrace,
          // startTime is ignored by backend now but we keep it for API compatibility
          startTime: traceData.current[0]?.t || Date.now()
        })
      });
      
      const result = await response.json();
      
      if (result.success) {
        // Typically you'd pass some token back
        onSuccess?.('verification_passed_token_here');
      } else {
        setErrorMsg(result.message || '验证失败');
        onFail?.(result.message);
        // Refresh captcha on fail
        setTimeout(fetchCaptcha, 1000);
      }
    } catch (error) {
      console.error(error);
      setErrorMsg('网络请求失败');
    } finally {
      setVerifying(false);
    }
  };

  if (loading && !challenge) {
    return <div style={styles.container}>加载中...</div>;
  }

  return (
    <div style={styles.container} ref={captchaRef} onMouseMove={handleMouseMove}>
      <div style={styles.header}>
        <div style={styles.title}>请选出所有包含</div>
        <div style={styles.target}>{challenge?.targetName}</div>
        <div style={styles.subtitle}>的图片</div>
      </div>
      
      {errorMsg && <div style={styles.error}>{errorMsg}</div>}
      
      <div style={styles.grid}>
        {challenge?.images.map((imgUrl, index) => {
          const isSelected = selectedIndexes.includes(index);
          return (
            <div 
              key={index} 
              style={{
                ...styles.imageWrapper,
                border: isSelected ? '3px solid #1890ff' : '3px solid transparent'
              }}
              onClick={() => toggleSelect(index)}
            >
              <img 
                src={imgUrl} 
                alt={`captcha-${index}`} 
                style={styles.image} 
                draggable={false}
              />
              {isSelected && (
                <div style={styles.checkmark}>
                  <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                </div>
              )}
            </div>
          );
        })}
      </div>
      
      <div style={styles.footer}>
        <button 
          style={styles.refreshBtn} 
          onClick={fetchCaptcha} 
          disabled={loading || verifying}
        >
          刷新
        </button>
        <button 
          style={{
            ...styles.verifyBtn,
            opacity: selectedIndexes.length === 0 || verifying ? 0.5 : 1
          }} 
          onClick={handleVerify}
          disabled={selectedIndexes.length === 0 || verifying}
        >
          {verifying ? '验证中...' : '确认'}
        </button>
      </div>
    </div>
  );
};

// Inline styles for zero-dependency demo
const styles = {
  container: {
    width: '320px',
    backgroundColor: '#fff',
    borderRadius: '8px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
    padding: '16px',
    fontFamily: 'sans-serif',
    boxSizing: 'border-box' as const,
  },
  header: {
    marginBottom: '16px',
  },
  title: {
    fontSize: '14px',
    color: '#333',
  },
  target: {
    fontSize: '20px',
    fontWeight: 'bold',
    color: '#1890ff',
    margin: '4px 0',
  },
  subtitle: {
    fontSize: '12px',
    color: '#666',
  },
  error: {
    color: '#ff4d4f',
    fontSize: '12px',
    marginBottom: '8px',
    padding: '4px 8px',
    backgroundColor: '#fff2f0',
    borderRadius: '4px',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '4px',
    marginBottom: '16px',
  },
  imageWrapper: {
    position: 'relative' as const,
    cursor: 'pointer',
    borderRadius: '4px',
    overflow: 'hidden',
    aspectRatio: '1',
    boxSizing: 'border-box' as const,
  },
  image: {
    width: '100%',
    height: '100%',
    objectFit: 'cover' as const,
    display: 'block',
  },
  checkmark: {
    position: 'absolute' as const,
    top: '4px',
    right: '4px',
    backgroundColor: '#1890ff',
    color: '#fff',
    borderRadius: '50%',
    width: '24px',
    height: '24px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  footer: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  refreshBtn: {
    background: 'none',
    border: 'none',
    color: '#666',
    cursor: 'pointer',
    fontSize: '14px',
    padding: '4px 8px',
  },
  verifyBtn: {
    backgroundColor: '#1890ff',
    color: '#fff',
    border: 'none',
    borderRadius: '4px',
    padding: '8px 24px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 'bold',
  }
};

export default BangCaptcha;