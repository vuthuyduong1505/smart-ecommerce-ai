import './App.css'

function App() {
  return (
    <div className="container">
      <header className="header">
        <h1>Smart E-commerce AI</h1>
        <p className="subtitle">Nền tảng thương mại điện tử thông minh tích hợp AI</p>
      </header>

      <div className="card">
        <h2>Foundation Status: Ready</h2>
        <p>Giai đoạn khởi tạo nền tảng dự án (Project Foundation) đã hoàn tất.</p>
        <div className="status-grid">
          <div className="status-item">
            <strong>Frontend:</strong> React + TypeScript + Vite (Port 5173)
          </div>
          <div className="status-item">
            <strong>Backend:</strong> Java 21 + Spring Boot (Port 8080)
          </div>
          <div className="status-item">
            <strong>AI Service:</strong> Python 3.11 + FastAPI (Port 8000)
          </div>
          <div className="status-item">
            <strong>Categories:</strong> Laptop, Phone, Tablet, Accessories
          </div>
        </div>
      </div>
    </div>
  )
}

export default App
