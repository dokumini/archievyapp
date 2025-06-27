import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import AuthPage from './pages/AuthPage';
import DashboardPage from './pages/DashboardPage';

function App() {
  // State untuk melacak status autentikasi dan user saat ini
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  // Efek samping untuk memeriksa status autentikasi dari localStorage saat aplikasi dimuat
  useEffect(() => {
    const storedAuth = localStorage.getItem('isAuthenticated') === 'true';
    const storedUser = localStorage.getItem('currentUser');
    if (storedAuth && storedUser) {
      setIsAuthenticated(true);
      setCurrentUser(JSON.parse(storedUser));
    }
  }, []); // [] memastikan efek ini hanya berjalan sekali saat mount

  // Fungsi yang dipanggil saat login berhasil
  const handleLoginSuccess = (user) => {
    setIsAuthenticated(true);
    setCurrentUser(user);
    localStorage.setItem('isAuthenticated', 'true');
    localStorage.setItem('currentUser', JSON.stringify(user));
  };

  // Fungsi yang dipanggil saat logout
  const handleLogout = () => {
    setIsAuthenticated(false);
    setCurrentUser(null);
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('currentUser');
  };

  return (
    <Router>
      <Routes>
        {/* Route untuk halaman login/registrasi */}
        <Route path="/login" element={<AuthPage onLoginSuccess={handleLoginSuccess} />} />

        {/* Route yang dilindungi untuk dashboard */}
        <Route
          path="/dashboard"
          element={
            isAuthenticated ? (
              <DashboardPage currentUser={currentUser} onLogout={handleLogout} />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        {/* Redirect default ke dashboard jika sudah login, atau ke login jika belum */}
        <Route
          path="/"
          element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />}
        />
      </Routes>
    </Router>
  );
}

export default App;
