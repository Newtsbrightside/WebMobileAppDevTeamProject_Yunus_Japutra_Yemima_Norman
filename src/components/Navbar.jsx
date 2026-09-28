import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useStore } from '../context/StoreContext';
import { LogOut, UserRound, Heart, LayoutDashboard, Plus, ShoppingBag } from 'lucide-react';
import { NavLink, Link } from 'react-router-dom';

const Navbar = () => {
  const { user, logout } = useAuth();
  const { wishlist, cart } = useStore();

  const handleWishlistClick = (e) => {
    e.preventDefault();
    window.dispatchEvent(new CustomEvent('open-wishlist-modal'));
  };

  const handleCartClick = (e) => {
    e.preventDefault();
    window.dispatchEvent(new CustomEvent('open-cart-modal'));
  };

  return (
    <nav className="topbar">
      <div className="topbar-inner">
        <Link to="/" className="brand">
          <span className="brand-mark">F</span>
          <span className="brand-name">FINISHLINE</span>
        </Link>

        <div className="nav-links">
          <NavLink to="/" end className="nav-link">
            <LayoutDashboard size={16} />
            <span className="nav-label">Dashboard</span>
          </NavLink>

          {user?.role === 'administrator' ? (
            <NavLink to="/add-shoe" className="nav-link">
              <Plus size={16} />
              <span className="nav-label">Add Shoe</span>
            </NavLink>
          ) : (
            <>
              <button
                type="button"
                onClick={handleWishlistClick}
                className="nav-link nav-btn"
                title="View Wishlist"
                aria-label="View Wishlist"
              >
                <Heart size={16} fill={wishlist?.length > 0 ? 'currentColor' : 'none'} />
                <span className="nav-label">Wishlist</span>
                {wishlist?.length > 0 && <span className="nav-count">{wishlist.length}</span>}
              </button>

              <button
                type="button"
                onClick={handleCartClick}
                className="nav-link nav-btn"
                title="View Shopping Bag"
                aria-label="View Shopping Bag"
              >
                <ShoppingBag size={16} />
                <span className="nav-label">Bag</span>
                {cart?.length > 0 && <span className="nav-count">{cart.length}</span>}
              </button>
            </>
          )}
        </div>

        <div className="account-actions">
          <span className="user-chip">
            <UserRound size={13} />
            <span>{user?.username}</span>
            <span className="user-role-badge">
              {user?.role === 'administrator' ? 'ADMIN' : 'CLIENT'}
            </span>
          </span>
          <button
            onClick={logout}
            className="icon-button logout-btn"
            title="Log out"
            aria-label="Log out"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
