// Entry point: mounts App inside BrowserRouter + the shared data providers
import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import { TicketProvider } from './context/TicketContext.jsx'
import { BookingProvider } from './context/BookingContext.jsx'
import { ReleaseProvider } from './context/ReleaseContext.jsx'
import { WorkProvider } from './context/WorkContext.jsx'
import { initTheme } from './hooks/useTheme.js'
import './index.css'

// Before the first paint, so a dark-mode user never sees a white flash
initTheme()

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <TicketProvider>
        <BookingProvider>
          <ReleaseProvider>
            <WorkProvider>
              <App />
            </WorkProvider>
          </ReleaseProvider>
        </BookingProvider>
      </TicketProvider>
    </BrowserRouter>
  </React.StrictMode>
)
