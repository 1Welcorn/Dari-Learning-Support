import React, { createContext, useContext, useState, useEffect } from 'react';
import type { UserRole } from '../types';
import { supabase } from '../services/supabase';
import type { User } from '@supabase/supabase-js';

interface AuthContextType {
  role: UserRole;
  user: User | null;
  loading: boolean;
  authError: string | null;
  signInWithGoogle: () => Promise<void>;
  signInWithName: (name: string, pin: string) => Promise<boolean>;
  loginWithRole: (role: UserRole) => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const ADMIN_EMAILS = ['willians.souza@escola.pr.gov.br', 'f4330252301@gmail.com']; 
const MEDIATOR_EMAILS: string[] = []; 
]; 

const CUSTOM_STUDENTS = [
  { name: 'ASMA QARI ZADAH', pin: 'asma', email: 'asma@pontes.com' },
  { name: 'HOSNA QARI ZADAH', pin: 'hosna', email: 'hosna@pontes.com' }
];
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<UserRole>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    console.log("AuthProvider: Initializing...");
    // Verificar sessão atual
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log("AuthProvider: Session found:", !!session);
      if (session?.user) {
        handleUser(session.user);
      } else {
        const savedMock = localStorage.getItem('dari_mock_user');
        if (savedMock) {
          const mockUser = JSON.parse(savedMock);
          setUser(mockUser);
          setRole('student');
        }
      }
      setLoading(false);
    }).catch(err => {
      console.error("AuthProvider: Error getting session:", err);
      setLoading(false);
    });

    // Escutar mudanças de auth
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      handleUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleUser = (user: User | null) => {
    console.log("AuthContext: Handling user:", user?.email);
    setUser(user);
    if (user && user.email) {
      if (ADMIN_EMAILS.includes(user.email)) {
        console.log("AuthContext: User is ADMIN");
        setRole('admin');
        localStorage.setItem('dari_role', 'admin');
      } else if (MEDIATOR_EMAILS.includes(user.email)) {
        console.log("AuthContext: User is MEDIATOR");
        setRole('mediator');
        localStorage.setItem('dari_role', 'mediator');
      } else {
        console.log("AuthContext: User is STUDENT (default)");
        setRole('student');
        localStorage.setItem('dari_role', 'student');
      }
    } else {
      setRole(null);
      localStorage.removeItem('dari_role');
    }
  };

  const signInWithGoogle = async () => {
    setAuthError(null);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/`,
        queryParams: {
          prompt: 'select_account'
        }
      }
    });
    if (error) console.error('Error logging in with Google:', error.message);
  };

  const signInWithName = async (name: string, pin: string): Promise<boolean> => {
    setAuthError(null);
    const student = CUSTOM_STUDENTS.find(s => s.name.toUpperCase() === name.toUpperCase() && s.pin.toLowerCase() === pin.toLowerCase());
    
    if (student) {
      // Para simplificar e permitir login sem e-mail real no Supabase Auth,
      // usaremos um mock user object e setaremos a role manualmente.
      const mockUser: any = {
        id: `mock-${student.name.replace(/\s+/g, '-').toLowerCase()}`,
        email: student.email,
        user_metadata: { full_name: student.name }
      };
      
      setUser(mockUser);
      setRole('student');
      localStorage.setItem('dari_role', 'student');
      localStorage.setItem('dari_mock_user', JSON.stringify(mockUser));
      return true;
    } else {
      setAuthError("Nome ou senha incorretos.");
      return false;
    }
  };

  const loginWithRole = (newRole: UserRole) => {
    setRole(newRole);
    if (newRole) localStorage.setItem('dari_role', newRole);
    else localStorage.removeItem('dari_role');
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setRole(null);
    setUser(null);
    localStorage.removeItem('dari_role');
    localStorage.removeItem('dari_mock_user');
  };

  return (
    <AuthContext.Provider value={{ role, user, loading, authError, signInWithGoogle, loginWithRole, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
