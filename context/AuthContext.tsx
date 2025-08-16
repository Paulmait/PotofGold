import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type UserRole = 'guest' | 'player' | 'admin';

export interface AuthUser {
  id: string;
  username: string;
  role: UserRole;
  token: string;
}

interface AuthContextType {
  user: AuthUser | null;
  login: (user: AuthUser) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    // Optionally, load user from secure storage here
  }, []);

  const login = (userData: AuthUser) => {
    setUser(userData);
    // Optionally, save to secure storage
  };

  const logout = () => {
    setUser(null);
    // Optionally, clear secure storage
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
