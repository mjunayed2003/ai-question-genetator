import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth';
import { auth, googleProvider, isFirebaseConfigured } from '../firebase/config';
import { api } from '../api/client';
import type { AuthUser } from '../types';

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  isLoggingIn: boolean;
  isFirebaseConfigured: boolean;
  isLoginModalOpen: boolean;
  openLoginModal: () => void;
  closeLoginModal: () => void;
  loginWithGoogle: () => Promise<void>;
  quickLogin: (email: string, name?: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  // Sync user with backend and localStorage
  const syncAndSetUser = async (authUser: AuthUser) => {
    localStorage.setItem('questai_user_id', authUser.uid);
    localStorage.setItem('questai_user_data', JSON.stringify(authUser));
    setUser(authUser);

    try {
      await api.syncUser({
        uid: authUser.uid,
        email: authUser.email,
        name: authUser.displayName,
        avatar: authUser.photoURL,
      });
    } catch (err) {
      console.warn('Backend user sync warning:', err);
    }
  };

  useEffect(() => {
    // Check cached session first
    const cachedData = localStorage.getItem('questai_user_data');
    if (cachedData) {
      try {
        const parsed = JSON.parse(cachedData);
        setUser(parsed);
      } catch {
        localStorage.removeItem('questai_user_data');
      }
    }

    if (isFirebaseConfigured) {
      const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
        if (fbUser && fbUser.email) {
          try {
            const token = await fbUser.getIdToken();
            localStorage.setItem('questai_auth_token', token);
          } catch (tokenErr) {
            console.warn('Failed to retrieve Firebase ID token:', tokenErr);
          }

          const authUser: AuthUser = {
            uid: fbUser.uid,
            email: fbUser.email,
            displayName: fbUser.displayName || fbUser.email.split('@')[0],
            photoURL: fbUser.photoURL || null,
          };
          await syncAndSetUser(authUser);
        } else if (!cachedData) {
          setUser(null);
          localStorage.removeItem('questai_user_id');
          localStorage.removeItem('questai_user_data');
          localStorage.removeItem('questai_auth_token');
        }
        setLoading(false);
      });

      return () => unsubscribe();
    } else {
      setLoading(false);
    }
  }, []);

  const loginWithGoogle = async () => {
    if (!isFirebaseConfigured) {
      setIsLoginModalOpen(true);
      throw new Error(
        'Firebase is not yet configured in frontend/.env. Please paste your Firebase web config keys to enable Google login.'
      );
    }

    try {
      setIsLoggingIn(true);
      const result = await signInWithPopup(auth, googleProvider);
      const fbUser = result.user;

      if (fbUser && fbUser.email) {
        try {
          const token = await fbUser.getIdToken();
          localStorage.setItem('questai_auth_token', token);
        } catch (tokenErr) {
          console.warn('Failed to fetch ID token:', tokenErr);
        }

        const authUser: AuthUser = {
          uid: fbUser.uid,
          email: fbUser.email,
          displayName: fbUser.displayName || fbUser.email.split('@')[0],
          photoURL: fbUser.photoURL || null,
        };
        await syncAndSetUser(authUser);
        setIsLoginModalOpen(false);
      }
    } catch (err: any) {
      // User closed popup window deliberately - don't treat as fatal error
      if (err.code === 'auth/popup-closed-by-user' || err.code === 'auth/cancelled-popup-request') {
        return;
      }

      let errorMessage = err.message || 'Google Sign-in failed';

      if (err.code === 'auth/unauthorized-domain') {
        const currentDomain = typeof window !== 'undefined' ? window.location.hostname : 'your domain';
        errorMessage = `Authorized Domain Error: "${currentDomain}" is not added in Firebase Console. Go to Firebase Console -> Authentication -> Settings -> Authorized Domains and add "${currentDomain}".`;
      } else if (err.code === 'auth/operation-not-allowed') {
        errorMessage =
          'Google Provider Disabled: Enable Google Sign-In under Firebase Console -> Authentication -> Sign-in method.';
      } else if (err.code === 'auth/invalid-api-key' || err.code === 'auth/api-key-not-valid') {
        errorMessage =
          'Invalid Firebase API Key: Please verify VITE_FIREBASE_API_KEY in frontend/.env.';
      }

      console.error('Google Sign-in error:', err);
      throw new Error(errorMessage);
    } finally {
      setIsLoggingIn(false);
    }
  };

  const quickLogin = async (email: string, name?: string) => {
    const cleanEmail = email.trim().toLowerCase();
    const cleanName = (name && name.trim()) || cleanEmail.split('@')[0];
    const uid = `gmail_${cleanEmail.replace(/[^a-zA-Z0-9]/g, '_')}`;

    const authUser: AuthUser = {
      uid,
      email: cleanEmail,
      displayName: cleanName,
      photoURL: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(cleanName)}`,
    };

    setIsLoggingIn(true);
    try {
      await syncAndSetUser(authUser);
      setIsLoginModalOpen(false);
    } finally {
      setIsLoggingIn(false);
    }
  };

  const logout = async () => {
    try {
      if (isFirebaseConfigured) {
        await signOut(auth);
      }
    } catch (err) {
      console.warn('SignOut error:', err);
    } finally {
      setUser(null);
      localStorage.removeItem('questai_user_id');
      localStorage.removeItem('questai_user_data');
      localStorage.removeItem('questai_auth_token');
      // Trigger a page reload or state refresh so lists re-fetch without user filter
      window.location.reload();
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isLoggingIn,
        isFirebaseConfigured,
        isLoginModalOpen,
        openLoginModal: () => setIsLoginModalOpen(true),
        closeLoginModal: () => setIsLoginModalOpen(false),
        loginWithGoogle,
        quickLogin,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

