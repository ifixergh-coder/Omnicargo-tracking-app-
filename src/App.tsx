import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import TrackPage from './pages/TrackPage'
import DriverPage from './pages/DriverPage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/track" element={<TrackPage />} />
        <Route path="/track/:trackingNumber" element={<TrackPage />} />
        <Route path="/driver" element={<DriverPage />} />
      </Routes>
    </BrowserRouter>
  )
}
