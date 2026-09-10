import { HashRouter, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Home from './pages/Home'
import GettingStarted from './pages/GettingStarted'
import Tutorial from './pages/Tutorial'
import ApiReference from './pages/ApiReference'
import Ssr from './pages/Ssr'

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/getting-started" element={<GettingStarted />} />
          <Route path="/tutorial" element={<Tutorial />} />
          <Route path="/api" element={<ApiReference />} />
          <Route path="/ssr" element={<Ssr />} />
        </Route>
      </Routes>
    </HashRouter>
  )
}
