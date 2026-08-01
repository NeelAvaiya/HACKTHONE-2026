// Entry point: mounts App inside BrowserRouter + TicketProvider
import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import { TicketProvider } from './context/TicketContext.jsx'
import { BookingProvider } from './context/BookingContext.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <TicketProvider>
        <BookingProvider>
          <App />
        </BookingProvider>
      </TicketProvider>
    </BrowserRouter>
  </React.StrictMode>
)
