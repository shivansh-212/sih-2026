import React, { StrictMode, Component } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[React Error Boundary]', error, errorInfo);
  }

  handleReset = () => {
    try {
      localStorage.removeItem('bhu_selected_prop');
    } catch (_) {}
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          height: '100vh',
          width: '100vw',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#f8f9fa',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          color: '#202124',
          padding: '24px',
          textAlign: 'center'
        }}>
          <div style={{
            background: '#ffffff',
            padding: '32px',
            borderRadius: '16px',
            boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
            maxWidth: '520px',
            border: '1px solid #dadce0'
          }}>
            <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#1a73e8', marginBottom: '8px' }}>
              BHU-ID Surface GIS
            </h2>
            <p style={{ fontSize: '13.5px', color: '#5f6368', marginBottom: '16px' }}>
              Geospatial UI dashboard recovered safely. Click below to resume live mapping.
            </p>
            {this.state.error && (
              <div style={{
                background: '#fce8e6',
                border: '1px solid #f28b82',
                borderRadius: '8px',
                padding: '8px 12px',
                fontSize: '11.5px',
                color: '#c5221f',
                fontFamily: 'monospace',
                marginBottom: '18px',
                textAlign: 'left',
                maxHeight: '120px',
                overflowY: 'auto'
              }}>
                {this.state.error.message || String(this.state.error)}
              </div>
            )}
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              <button
                onClick={this.handleReset}
                style={{
                  background: '#1a73e8',
                  color: '#ffffff',
                  border: 'none',
                  padding: '10px 20px',
                  borderRadius: '8px',
                  fontSize: '13.5px',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                Resume Dashboard
              </button>
              <button
                onClick={() => window.location.reload()}
                style={{
                  background: '#f1f3f4',
                  color: '#202124',
                  border: '1px solid #dadce0',
                  padding: '10px 18px',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Full Reload
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)
