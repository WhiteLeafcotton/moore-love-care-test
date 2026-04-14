import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'; // Global reset first
import App from './App'; // Specific App styles last

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)