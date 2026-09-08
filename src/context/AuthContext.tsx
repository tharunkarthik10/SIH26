import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, Role } from '../types';
import { auth, isFirebaseConfigured } from '../services/firebase';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth';

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  login: (email?: string, password?: string, demoRole?: Role) => Promise<void>;
  logout: () => Promise<void>;
  switchRole: (role: Role) => void;
}

const DEFAULT_DEMO_USER: UserProfile = {
  uid: 'sih-demo-supervisor-01',
  email: 'supervisor@industrial-safety.org',
  displayName: 'Plant Supervisor (SIH Demo)',
  role: 'Supervisor',
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(DEFAULT_DEMO_USER);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    if (isFirebaseConfigured && auth) {
      setLoading(true);
      const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
        if (firebaseUser) {
          setUser({
            uid: firebaseUser.uid,
            email: firebaseUser.email || 'user@sih.org',
            displayName: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Safety Officer',
            role: 'Supervisor',
          });
        } else {
          // If no firebase user, fallback to demo user for easy SIH demo experience
          setUser(DEFAULT_DEMO_USER);
        }
        setLoading(false);
      });
      return () => unsubscribe();
    }
  }, []);

  const login = async (email?: string, password?: string, demoRole: Role = 'Supervisor') => {
    setLoading(true);
    try {
      if (isFirebaseConfigured && auth && email && password) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        // Fast demo login
        const role = demoRole || (email?.includes('admin') ? 'Admin' : 'Supervisor');
        setUser({
          uid: `sih-demo-${role.toLowerCase()}-${Date.now()}`,
          email: email || `${role.toLowerCase()}@industrial-safety.org`,
          displayName: `${role} Officer`,
          role,
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      if (isFirebaseConfigured && auth) {
        await signOut(auth);
      }
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const switchRole = (role: Role) => {
    if (user) {
      setUser({
        ...user,
        role,
        displayName: `${role} Officer`,
      });
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, switchRole }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
