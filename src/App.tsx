import { Navigate, Route, Routes } from 'react-router-dom'
import { Layout } from './components/Layout'
import Dashboard from './routes/Dashboard'
import Log from './routes/Log'
import History from './routes/History'
import Redo from './routes/Redo'
import Session from './routes/Session'
import Roadmap from './routes/Roadmap'
import Review from './routes/Review'
import Settings from './routes/Settings'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="log" element={<Log />} />
        <Route path="history" element={<History />} />
        <Route path="redo" element={<Redo />} />
        <Route path="session" element={<Session />} />
        <Route path="roadmap" element={<Roadmap />} />
        <Route path="review" element={<Review />} />
        <Route path="settings" element={<Settings />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}
