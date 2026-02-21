import { useState, useEffect } from 'react'
import './App.css'

function App() {
  const [alerts, setAlerts] = useState([])
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const res = await fetch('http://localhost:8000/api/alerts')
        if (!res.ok) throw new Error('Failed to fetch alerts')
        const data = await res.json()
        setAlerts(data.alerts)
        setError(null)
      } catch (err) {
        console.error("Error fetching alerts:", err)
        setError('Failed to connect to server...')
      }
    }

    fetchAlerts()
    const interval = setInterval(fetchAlerts, 2000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="app-container">
      <header className="header">
        <h1>RetailGuard Live Alerts</h1>
        <p>Real-Time Theft Detection Monitoring</p>
      </header>

      <main className="main-content">
        {error && (
          <div className="error-banner">
            ⚠️ {error}
          </div>
        )}

        <div className="alerts-grid">
          {alerts.length === 0 && !error ? (
            <div className="empty-state">
              <div className="empty-icon">🛡️</div>
              <h2>All Clear!</h2>
              <p>No suspicious activities detected yet.</p>
            </div>
          ) : (
            alerts.map(alert => {
              let displayTime = alert.filename
              try {
                const match = alert.filename.match(/(\d{8})_(\d{6})/);
                if (match) {
                  const dateStr = match[1];
                  const timeStr = match[2];
                  const year = dateStr.substring(0, 4);
                  const month = dateStr.substring(4, 6);
                  const day = dateStr.substring(6, 8);
                  const hour = timeStr.substring(0, 2);
                  const min = timeStr.substring(2, 4);
                  const sec = timeStr.substring(4, 6);
                  displayTime = `${year}-${month}-${day} ${hour}:${min}:${sec}`;
                }
              } catch (e) {
                // ignore
              }

              return (
                <div key={alert.id} className="alert-card">
                  <div className="alert-image-wrapper">
                    <img src={`http://localhost:8000${alert.url}`} alt={alert.filename} className="alert-image"/>
                  </div>
                  <div className="alert-details">
                    <span className="alert-badge">THEFT DETECTED</span>
                    <span className="alert-time">{displayTime}</span>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </main>
    </div>
  )
}

export default App
