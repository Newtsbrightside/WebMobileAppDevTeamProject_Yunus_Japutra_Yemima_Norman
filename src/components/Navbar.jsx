import React from 'react';
import { useAuth } from '../context/AuthContext';
import { LogOut, UserRound, Heart, LayoutDashboard, Plus } from 'lucide-react';
import { NavLink, Link } from 'react-router-dom';

const Navbar = () => {
  const { user, logout } = useAuth();

  return (
    <nav className="topbar">
      <div className="topbar-inner">
        <Link to="/" className="brand"><span className="brand-mark">F</span><span>FINISHLINE</span></Link>
        <div className="nav-links">
          <NavLink to="/" end className="nav-link"><LayoutDashboard size={16} /> Dashboard</NavLink>
          {user.role === 'administrator' ? <NavLink to="/add-shoe" className="nav-link"><Plus size={16} /> Add shoe</NavLink> : <a href="#wishlist" className="nav-link"><Heart size={16} /> Wishlist</a>}
        </div>
        <div className="account-actions">
          <span className="user-chip"><UserRound size={15} /> {user.username}</span>
          <button onClick={logout} className="icon-button" title="Log out"><LogOut size={17} /></button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
