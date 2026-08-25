import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, googleAuthProvider } from '../lib/firebase.ts';
import { signInWithPopup, signOut, onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { api } from '../lib/apiClient.ts';
import { User, UserRole } from '../types.ts';

interface AuthContextType {
  currentUser: User | null;
  firebaseUser: FirebaseUser | null;
  activeRole: UserRole;
  isAuthenticated: boolean;
  isLoading: boolean;
  unreadCount: number;
  login: (credentials: { role: UserRole; identifier?: string; email?: string; password?: string }) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  switchDemoRole: (role: UserRole, email?: string) => Promise<void>;
  refreshProfile: () => Promise<void>;
  setIsAuthenticated: (val: boolean) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [activeRole, setActiveRole] = useState<UserRole>((api.getDemoRole() as UserRole) || 'super_admin');
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem('cms_is_authenticated') === 'true';
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [unreadCount, setUnreadCount] = useState<number>(0);

  const fetchCurrentProfile = async () => {
    try {
      setIsLoading(true);
      const res = await api.get('/auth/me');
      if (res.success && res.data) {
        setCurrentUser(res.data.user);
        setActiveRole(res.data.user.role);
        setUnreadCount(res.data.unreadNotificationCount || 0);
      }
    } catch (err) {
      console.warn('Initial fetch user profile note:', err);
      // Construct immediate fallback demo user so UI remains active
      const role = (api.getDemoRole() as UserRole) || 'super_admin';
      const email = api.getDemoEmail() || 'superadmin@aitm.edu';
      const fallbackName = 
        role === 'super_admin' ? 'Dr. Arthur Vance (Super Admin)' :
        role === 'admin' ? 'Eleanor Davis (College Admin)' :
        role === 'hod' ? 'Dr. Robert Jenkins (HOD - CSE)' :
        role === 'faculty' ? 'Prof. Sarah Connor' :
        role === 'placement_officer' ? 'Marcus Sterling (Placement Officer)' :
        'Alex Chen (Student)';

      setCurrentUser({
        id: 1,
        uid: 'demo_' + role,
        email,
        name: fallbackName,
        role,
        status: 'active',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrentProfile();

    const unsubscribe = onAuthStateChanged(auth, (fbUser) => {
      setFirebaseUser(fbUser);
      if (fbUser) {
        setIsAuthenticated(true);
        localStorage.setItem('cms_is_authenticated', 'true');
        fetchCurrentProfile();
      }
    });

    return () => unsubscribe();
  }, []);

  const login = async (credentials: { role: UserRole; identifier?: string; email?: string; password?: string }) => {
    try {
      setIsLoading(true);
      const res = await api.post('/auth/login', credentials);
      if (res.success && res.data) {
        const user = res.data.user;
        api.setDemoUser(user.role, user.email);
        setActiveRole(user.role);
        setCurrentUser(user);
        setIsAuthenticated(true);
        localStorage.setItem('cms_is_authenticated', 'true');
        await fetchCurrentProfile();
      } else {
        throw new Error(res.message || 'Login failed');
      }
    } catch (err) {
      console.error('Login error:', err);
      // Fallback: switch demo role
      await switchDemoRole(credentials.role, credentials.email || credentials.identifier);
      setIsAuthenticated(true);
      localStorage.setItem('cms_is_authenticated', 'true');
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithGoogle = async () => {
    try {
      setIsLoading(true);
      await signInWithPopup(auth, googleAuthProvider);
      setIsAuthenticated(true);
      localStorage.setItem('cms_is_authenticated', 'true');
      await fetchCurrentProfile();
    } catch (error: any) {
      if (error?.code === 'auth/popup-closed-by-user' || error?.code === 'auth/cancelled-popup-request') {
        // User voluntarily dismissed the Google sign-in window - benign user cancellation
        console.info('Google sign-in popup was closed by user.');
        return;
      }
      console.warn('Google sign-in notice:', error?.message || error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      setFirebaseUser(null);
      setIsAuthenticated(false);
      localStorage.removeItem('cms_is_authenticated');
      await api.post('/auth/logout', {});
    } catch (error) {
      console.error('Logout error:', error);
      setIsAuthenticated(false);
      localStorage.removeItem('cms_is_authenticated');
    }
  };

  const switchDemoRole = async (role: UserRole, email?: string) => {
    const defaultEmail = email || (
      role === 'super_admin' ? 'superadmin@aitm.edu' :
      role === 'admin' ? 'admin@aitm.edu' :
      role === 'hod' ? 'hod.cse@aitm.edu' :
      role === 'faculty' ? 'sarah.connor@aitm.edu' :
      role === 'placement_officer' ? 'placement@aitm.edu' :
      'alex.chen@student.aitm.edu'
    );

    api.setDemoUser(role, defaultEmail);
    setActiveRole(role);
    setIsAuthenticated(true);
    localStorage.setItem('cms_is_authenticated', 'true');
    await fetchCurrentProfile();
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        firebaseUser,
        activeRole,
        isAuthenticated,
        isLoading,
        unreadCount,
        login,
        loginWithGoogle,
        logout,
        switchDemoRole,
        refreshProfile: fetchCurrentProfile,
        setIsAuthenticated,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
