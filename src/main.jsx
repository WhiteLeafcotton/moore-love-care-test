import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App' // <--- Ensure this is App and not a different file
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)