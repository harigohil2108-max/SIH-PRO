import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import DownloadPage from './DownloadPage'
import './index.css'

const isDownload = window.location.pathname === '/download'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    {isDownload ? <DownloadPage /> : <App />}
  </React.StrictMode>,
)
