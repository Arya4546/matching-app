import React, { useEffect, useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import { useLocation } from './contexts/LocationContext';
import SplashScreen from './components/common/SplashScreen';
import Register from './components/auth/Register';
import Login from './components/auth/Login';
import VerifySMS from './components/auth/VerifySMS';
import MapView from './components/map/MapView';
import Profile from './components/profile/Profile';
import './styles/App.css';

function App() {
  const { user, loading: authLoading } = useAuth();
  const { requestLocationPermission } = useLocation();
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (user && !showSplash) {
      requestLocationPermission();
    }
  }, [user, showSplash, requestLocationPermission]);

  if (showSplash) {
    return <SplashScreen />;
  }

  if (authLoading) {
    return <div className="loading-screen">Loading...</div>;
  }

  return (
    <div className="App">
      <Routes>
        <Route 
          path="/" 
          element={user ? <Navigate to="/map" /> : <Navigate to="/login" />} 
        />
        <Route 
          path="/register" 
          element={!user ? <Register /> : <Navigate to="/map" />} 
        />
        <Route 
          path="/login" 
          element={!user ? <Login /> : <Navigate to="/map" />} 
        />
        <Route
          path="/verify-sms"
          element={!user ? <VerifySMS /> : <Navigate to="/map" />}
        />
        <Route 
          path="/map" 
          element={user ? <MapView /> : <Navigate to="/login" />} 
        />
        <Route 
          path="/profile" 
          element={user ? <Profile /> : <Navigate to="/login" />} 
        />
      </Routes>
    </div>
  );
}

export default App;