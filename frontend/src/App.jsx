import { Routes, Route } from 'react-router-dom';
import NavBar from './components/NavBar.jsx';
import { ProtectedRoute, AdminRoute } from './components/ProtectedRoute.jsx';

import Home from './pages/Home.jsx';
import Login from './pages/Login.jsx';
import Signup from './pages/Signup.jsx';
import Subscribe from './pages/Subscribe.jsx';
import Dashboard from './pages/Dashboard.jsx';
import ScoreEntry from './pages/ScoreEntry.jsx';
import Charities from './pages/Charities.jsx';
import Draws from './pages/Draws.jsx';
import AdminDashboard from './pages/AdminDashboard.jsx';

export default function App() {
  return (
    <div className="min-h-screen bg-ink">
      <NavBar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/subscribe" element={<Subscribe />} />
        <Route path="/charities" element={<Charities />} />
        <Route path="/draws" element={<Draws />} />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/scores"
          element={
            <ProtectedRoute>
              <ScoreEntry />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <AdminRoute>
              <AdminDashboard />
            </AdminRoute>
          }
        />
      </Routes>
    </div>
  );
}
