import React, { useState } from 'react';
import {
  FiX,
  FiLock,
  FiShield,
  FiMail,
  FiArrowRight,
  FiCopy,
  FiCheck,
  FiAlertTriangle,
  FiExternalLink,
} from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export const LoginModal: React.FC = () => {
  const {
    isLoginModalOpen,
    closeLoginModal,
    loginWithGoogle,
    quickLogin,
    isFirebaseConfigured,
    isLoggingIn,
  } = useAuth();
  const { showToast } = useToast();
  const [customEmail, setCustomEmail] = useState('');
  const [customName, setCustomName] = useState('');
  const [hasCopied, setHasCopied] = useState(false);

  if (!isLoginModalOpen) return null;

  const handleGoogleClick = async () => {
    try {
      await loginWithGoogle();
      showToast('Successfully signed in with Google!', 'success');
      closeLoginModal();
    } catch (err: any) {
      if (err.message) {
        showToast(err.message, 'error');
      }
    }
  };

  const handleCustomLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customEmail.trim() || !customEmail.includes('@')) {
      showToast('Please enter a valid email address', 'error');
      return;
    }

    try {
      await quickLogin(customEmail, customName);
      showToast(`Signed in as ${customEmail}`, 'success');
      closeLoginModal();
    } catch (err: any) {
      showToast(err.message || 'Login failed', 'error');
    }
  };

  const copyEnvTemplate = () => {
    const template = `# Firebase Web Configuration for Google OAuth
VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=1234567890
VITE_FIREBASE_APP_ID=1:1234567890:web:abcdef123456`;

    navigator.clipboard.writeText(template);
    setHasCopied(true);
    showToast('Firebase .env template copied to clipboard!', 'info');
    setTimeout(() => setHasCopied(false), 2500);
  };

  return (
    <div className="modal-backdrop animate-fade-in" onClick={closeLoginModal}>
      <div className="modal-dialog glass-panel" style={{ maxWidth: 520 }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-header-title">
            <FiLock className="text-cyan" size={20} />
            <h3>Google / Firebase Sign In</h3>
          </div>
          <button
            type="button"
            className="modal-close-btn"
            onClick={closeLoginModal}
            aria-label="Close"
          >
            <FiX size={18} />
          </button>
        </div>

        <div className="modal-body">
          <div className="auth-privacy-banner">
            <FiShield size={20} className="text-emerald flex-shrink-0" />
            <div>
              <p className="privacy-title">Private Workspace Guarantee</p>
              <p className="privacy-desc">
                Your question sets and uploaded documents remain private to your Google account.
              </p>
            </div>
          </div>

          {/* Primary Action: Google Login */}
          <div className="google-login-action mt-4">
            <button
              type="button"
              className="google-signin-btn"
              onClick={handleGoogleClick}
              disabled={isLoggingIn}
            >
              <svg className="google-icon" viewBox="0 0 24 24" width="20" height="20">
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
              <span>{isLoggingIn ? 'Connecting to Google...' : 'Continue with Google Account'}</span>
            </button>
          </div>

          {!isFirebaseConfigured && (
            <div className="firebase-guide-box mt-4">
              <div className="firebase-guide-header">
                <FiAlertTriangle size={18} className="text-amber" />
                <span className="font-semibold text-amber">Firebase Credentials Needed in frontend/.env</span>
              </div>
              <p className="firebase-guide-desc">
                Google OAuth requires your Firebase Web App credentials. Add them to <code>frontend/.env</code> to enable one-click popup login:
              </p>

              <ol className="firebase-steps-list">
                <li>
                  Open <a href="https://console.firebase.google.com" target="_blank" rel="noreferrer" className="text-cyan inline-flex items-center gap-1">Firebase Console <FiExternalLink size={12} /></a>
                </li>
                <li>Go to <strong>Project Settings &gt; General &gt; Your apps &gt; Web app</strong> and copy the config.</li>
                <li>In Firebase Console, go to <strong>Authentication &gt; Sign-in method</strong> and enable <strong>Google</strong>.</li>
                <li>Under <strong>Authentication &gt; Settings &gt; Authorized domains</strong>, ensure <code>localhost</code> is listed.</li>
              </ol>

              <div className="flex items-center justify-between mt-3">
                <button
                  type="button"
                  onClick={copyEnvTemplate}
                  className="btn btn-sm btn-secondary flex items-center gap-1.5"
                >
                  {hasCopied ? <FiCheck size={14} className="text-emerald" /> : <FiCopy size={14} />}
                  <span>{hasCopied ? 'Copied Template!' : 'Copy .env Template'}</span>
                </button>
              </div>
            </div>
          )}

          <div className="auth-divider">
            <span>or sign in locally (offline / test mode)</span>
          </div>

          {/* Quick Gmail / Local Entry Form */}
          <form onSubmit={handleCustomLogin} className="quick-gmail-form">
            <div className="form-group mb-3">
              <label className="form-label">
                <FiMail size={15} />
                <span>Email Address</span>
              </label>
              <input
                type="email"
                className="form-input"
                required
                placeholder="e.g. junayed@example.com"
                value={customEmail}
                onChange={(e) => setCustomEmail(e.target.value)}
              />
            </div>

            <div className="form-group mb-3">
              <label className="form-label">Display Name (Optional)</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Junayed"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
              />
            </div>

            <button
              type="submit"
              className="btn btn-secondary w-full"
              disabled={isLoggingIn || !customEmail.trim()}
            >
              <span>Continue with Local Test Session</span>
              <FiArrowRight size={16} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

