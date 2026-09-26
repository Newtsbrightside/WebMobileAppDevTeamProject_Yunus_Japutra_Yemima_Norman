import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import AddShoe from './pages/AddShoe';

function App() {
  const { user } = useAuth();

  return (
    <Router>
      <div className="app-container">
        {user && <Navbar />}
        <main>
          <Routes>
            <Route path="/login" element={!user ? <Login /> : <Navigate to="/" />} />
            
            <Route path="/" element={
              !user ? <Navigate to="/login" /> :
              <Dashboard />
            } />

            <Route path="/add-shoe" element={
              !user ? <Navigate to="/login" /> :
              user.role !== 'administrator' ? <Navigate to="/" /> : <AddShoe />
            } />
            
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
