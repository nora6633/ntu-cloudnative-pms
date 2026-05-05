import { useEffect, useState } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import './App.css';
import api from './api/axiosInstance';
import { AuthProvider } from './auth/AuthProvider';
import { useAuth } from './auth/AuthContext';
import ProtectedRoute from './auth/ProtectedRoute';
import Login from './pages/Login';

interface HelloResponse {
  message: string;
}

function Home() {
  const { user, logout } = useAuth();
  const [backendData, setBackendData] = useState<HelloResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .get<HelloResponse>('/hello')
      .then((res) => setBackendData(res.data))
      .catch(() => setError('Failed to reach backend'));
  }, []);

  return (
    <section style={{ maxWidth: 600, margin: '4rem auto' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between' }}>
        <h1>Welcome, {user?.username}</h1>
        <button onClick={logout}>Logout</button>
      </header>
      <p>Role: {user?.role}</p>
      {error && <p style={{ color: 'crimson' }}>{error}</p>}
      {backendData && <p>{backendData.message}</p>}
    </section>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Home />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
