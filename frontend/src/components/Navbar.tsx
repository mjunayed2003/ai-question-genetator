import React, { useEffect, useState, useRef } from 'react';
import { NavLink, Link, useLocation } from 'react-router-dom';
import {
  FiBookOpen,
  FiGrid,
  FiSliders,
  FiLayers,
  FiFileText,
  FiPlus,
  FiWifi,
  FiWifiOff,
  FiLogOut,
  FiUser,
  FiChevronDown,
  FiMenu,
  FiX,
} from 'react-icons/fi';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
// Reusable UserAvatar with no-referrer, crossOrigin, and graceful initials fallback
const UserAvatar: React.FC<{
  photoURL?: string | null;
  name?: string;
  size?: number;
}> = ({ photoURL, name, size = 30 }) => {
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setHasError(false);
  }, [photoURL]);

  const initials = (name || 'User')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join('');

  if (photoURL && !hasError) {
    return (
      <img
        src={photoURL}
        alt={name || 'User'}
        className="user-avatar-img"
        referrerPolicy="no-referrer"
        crossOrigin="anonymous"
        onError={() => setHasError(true)}
        style={{ width: `${size}px`, height: `${size}px` }}
      />
    );
  }

  return (
    <div
      className="user-avatar-placeholder"
      style={{
        width: `${size}px`,
        height: `${size}px`,
        fontSize: size > 32 ? '0.95rem' : '0.8rem',
      }}
    >
      {initials || <FiUser size={Math.round(size * 0.5)} />}
    </div>
  );
};

export const Navbar: React.FC = () => {
  const [isBackendOnline, setIsBackendOnline] = useState<boolean | null>(null);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const location = useLocation();

  const { user, loginWithGoogle, isLoggingIn, isFirebaseConfigured, openLoginModal, logout } = useAuth();
  const { showToast } = useToast();

  // Close mobile drawer when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  const handleDirectGoogleLogin = async () => {
    if (!isFirebaseConfigured) {
      showToast('Firebase .env setup required. Check configuration instructions.', 'info');
      openLoginModal();
      return;
    }

    try {
      await loginWithGoogle();
      showToast('Successfully signed in with Google!', 'success');
    } catch (err: any) {
      if (err.message) {
        showToast(err.message, 'error');
      }
    }
  };

  useEffect(() => {
    let mounted = true;
    const checkStatus = async () => {
      const ok = await api.checkHealth();
      if (mounted) setIsBackendOnline(ok);
    };

    checkStatus();
    const interval = setInterval(checkStatus, 25000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="navbar-wrapper">
      <div className="container navbar-inner">
        {/* Brand */}
        <Link to="/" className="brand-logo">
          <div className="brand-icon-box">
            <FiBookOpen size={20} className="brand-icon" />
          </div>
          <div className="brand-text-container">
            <span className="brand-title">QuestAI</span>
            <span className="brand-tag">Studio</span>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="nav-links">
          <NavLink
            to="/"
            end
            className={({ isActive }) => `nav-link ${isActive ? 'nav-link-active' : ''}`}
          >
            <FiGrid size={15} />
            <span>Home</span>
          </NavLink>

          <NavLink
            to="/generate"
            className={({ isActive }) => `nav-link ${isActive ? 'nav-link-active' : ''}`}
          >
            <FiSliders size={15} />
            <span>Generate</span>
          </NavLink>

          <NavLink
            to="/sets"
            className={({ isActive }) => `nav-link ${isActive ? 'nav-link-active' : ''}`}
          >
            <FiLayers size={15} />
            <span>Sets</span>
          </NavLink>

          <NavLink
            to="/documents"
            className={({ isActive }) => `nav-link ${isActive ? 'nav-link-active' : ''}`}
          >
            <FiFileText size={15} />
            <span>Documents</span>
          </NavLink>
        </nav>

        {/* Right Actions, Status & User Auth */}
        <div className="navbar-actions">
          <div
            className={`status-pill ${
              isBackendOnline === true
                ? 'status-online'
                : isBackendOnline === false
                ? 'status-offline'
                : 'status-checking'
            }`}
            title={
              isBackendOnline === true
                ? 'Connected to NestJS & PostgreSQL'
                : isBackendOnline === false
                ? 'Backend unreachable on localhost:3000'
                : 'Checking server connection'
            }
          >
            {isBackendOnline ? <FiWifi size={13} /> : <FiWifiOff size={13} />}
            <span>{isBackendOnline ? 'Online' : 'Offline'}</span>
          </div>

          <Link to="/generate" className="btn btn-primary btn-sm nav-cta">
            <FiPlus size={15} />
            <span>Create</span>
          </Link>

          {/* User Profile / Gmail Sign-In Button */}
          {user ? (
            <div className="user-profile-menu" ref={userMenuRef}>
              <button
                type="button"
                className="user-profile-btn"
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                aria-label="User Menu"
              >
                <UserAvatar
                  photoURL={user.photoURL}
                  name={user.displayName || user.email}
                  size={30}
                />
                <span className="user-name-label truncate">
                  {user.displayName || user.email.split('@')[0]}
                </span>
                <FiChevronDown size={14} className="text-dim" />
              </button>

              {isUserMenuOpen && (
                <div className="user-dropdown-menu animate-fade-in">
                  <div className="dropdown-user-header" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <UserAvatar
                      photoURL={user.photoURL}
                      name={user.displayName || user.email}
                      size={38}
                    />
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <p className="user-full-name">{user.displayName || 'Scholar'}</p>
                      <p className="user-full-email truncate">{user.email}</p>
                      <span className="user-workspace-pill">Private Workspace</span>
                    </div>
                  </div>

                  <div className="dropdown-divider" />

                  <Link
                    to="/sets"
                    className="dropdown-item"
                    onClick={() => setIsUserMenuOpen(false)}
                  >
                    <FiLayers size={15} />
                    <span>Question Sets</span>
                  </Link>

                  <Link
                    to="/documents"
                    className="dropdown-item"
                    onClick={() => setIsUserMenuOpen(false)}
                  >
                    <FiFileText size={15} />
                    <span>Documents</span>
                  </Link>

                  <div className="dropdown-divider" />

                  <button
                    type="button"
                    className="dropdown-item text-rose"
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      logout();
                    }}
                  >
                    <FiLogOut size={15} />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              type="button"
              className="google-nav-btn btn btn-sm"
              onClick={handleDirectGoogleLogin}
              disabled={isLoggingIn}
              title="Sign in directly with Google"
            >
              <svg className="google-icon-sm" viewBox="0 0 24 24" width="16" height="16">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>{isLoggingIn ? 'Connecting...' : 'Google Sign In'}</span>
            </button>
          )}

          {/* Mobile Hamburger Toggle Button */}
          <button
            type="button"
            className="mobile-menu-toggle"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle navigation menu"
          >
            {isMobileMenuOpen ? <FiX size={20} /> : <FiMenu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {isMobileMenuOpen && (
        <div className="mobile-nav-drawer animate-fade-in">
          <div className="mobile-nav-links">
            <NavLink
              to="/"
              end
              className={({ isActive }) => `nav-link ${isActive ? 'nav-link-active' : ''}`}
            >
              <FiGrid size={18} />
              <span>Home</span>
            </NavLink>

            <NavLink
              to="/generate"
              className={({ isActive }) => `nav-link ${isActive ? 'nav-link-active' : ''}`}
            >
              <FiSliders size={18} />
              <span>Generate</span>
            </NavLink>

            <NavLink
              to="/sets"
              className={({ isActive }) => `nav-link ${isActive ? 'nav-link-active' : ''}`}
            >
              <FiLayers size={18} />
              <span>Sets</span>
            </NavLink>

            <NavLink
              to="/documents"
              className={({ isActive }) => `nav-link ${isActive ? 'nav-link-active' : ''}`}
            >
              <FiFileText size={18} />
              <span>Documents</span>
            </NavLink>
          </div>

          <div className="mobile-nav-footer">
            <Link to="/generate" className="btn btn-primary w-full">
              <FiPlus size={16} />
              <span>Create</span>
            </Link>

            {user ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', width: '100%', marginTop: '0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.5rem 0' }}>
                  <UserAvatar photoURL={user.photoURL} name={user.displayName || user.email} size={36} />
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <p style={{ margin: 0, fontWeight: 600, fontSize: '0.875rem' }}>{user.displayName || 'Scholar'}</p>
                    <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-secondary)' }} className="truncate">{user.email}</p>
                  </div>
                </div>
                <button
                  type="button"
                  className="btn btn-secondary w-full text-rose"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    logout();
                  }}
                >
                  <FiLogOut size={15} />
                  <span>Sign Out</span>
                </button>
              </div>
            ) : (
              <button
                type="button"
                className="google-nav-btn btn w-full"
                onClick={handleDirectGoogleLogin}
                disabled={isLoggingIn}
              >
                <span>{isLoggingIn ? 'Connecting...' : 'Google Sign In'}</span>
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
