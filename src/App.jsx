// Routes only: client chat + support-side nested tabs (keyed for page-fade transition)
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import Navbar from './components/layout/Navbar.jsx'
import Landing from './pages/Landing.jsx'
import Client from './pages/Client.jsx'
import Chat from './pages/Chat.jsx'
import Support from './pages/Support.jsx'
import SupportInbox from './pages/SupportInbox.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Metrics from './pages/Metrics.jsx'
import SupportCalendar from './pages/SupportCalendar.jsx'
import MeetingRoom from './pages/MeetingRoom.jsx'
import ReviewPage from './pages/ReviewPage.jsx'
import ClientMeetings from './pages/ClientMeetings.jsx'
import AutoAssign from './pages/AutoAssign.jsx'
import ClientRequests from './pages/ClientRequests.jsx'
import SupportClientWork from './pages/SupportClientWork.jsx'

export default function App() {
  const location = useLocation()
  return (
    <div className="min-h-screen">
      <Navbar />
      <div key={location.pathname} className="page-fade">
        <Routes location={location}>
          <Route path="/" element={<Client />}>
            <Route index element={<Chat />} />
            <Route path="chat" element={<Chat />} />
            <Route path="meetings" element={<ClientMeetings />} />
            <Route path="auto-assign" element={<AutoAssign />} />
            <Route path="requests" element={<ClientRequests />} />
          </Route>
          <Route path="/support" element={<Support />}>
            <Route index element={<SupportInbox />} />
            <Route path="calendar" element={<SupportCalendar />} />
            <Route path="client-work" element={<SupportClientWork />} />
            {/* Reviews live in the Dashboard now — one place shows both sides */}
            <Route path="reviews" element={<Navigate to="/support/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="metrics" element={<Metrics />} />
          </Route>
          {/* Outside the /support tab shell so the call fills the page */}
          <Route path="/support/meeting/:id" element={<MeetingRoom />} />
          {/* One review page for both sides — :side is client | support */}
          <Route path="/review/:id/:side" element={<ReviewPage />} />
          <Route path="/landing" element={<Landing />} />
          {/* Booking now lives entirely in the chat — old /book page removed */}
          <Route path="/book" element={<Navigate to="/chat" replace />} />
          <Route path="/dashboard" element={<Navigate to="/support/dashboard" replace />} />
          <Route path="/metrics" element={<Navigate to="/support/metrics" replace />} />
        </Routes>
      </div>
    </div>
  )
}
