import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { User as FirebaseUser } from 'firebase/auth';
import { authService } from '../services/authService';
import { userService } from '../services/userService';
import { User, UserRole } from '../types';

interface AuthContextType {
  currentUser: FirebaseUser | null;
  userProfile: User | null;
  role: UserRole | null;
  activeTeacherId: string | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ firebaseUser: FirebaseUser | null; profile: User }>;
  registerAdmin: (data: {
    displayName: string;
    email: string;
    password: string;
    phone?: string;
    institutionName?: string;
  }) => Promise<{ firebaseUser: FirebaseUser | null; profile: User }>;
  logout: () => Promise<void>;
  refreshUserProfile: () => Promise<User | null>;
  authError: string | null;
  clearAuthError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<User | null>(() => authService.getStoredSessionUser());
  const [role, setRole] = useState<UserRole | null>(() => authService.getStoredSessionUser()?.role || null);
  const [activeTeacherId, setActiveTeacherId] = useState<string | null>(() => authService.getStoredSessionUser()?.teacherId || null);
  const [loading, setLoading] = useState<boolean>(true);
  const [authError, setAuthError] = useState<string | null>(null);

  const clearAuthError = useCallback(() => setAuthError(null), []);

  const refreshUserProfile = useCallback(async (): Promise<User | null> => {
    const user = authService.getCurrentUser();
    const targetUid = user?.uid || userProfile?.uid || userProfile?.id;
    if (!targetUid) {
      setUserProfile(null);
      setRole(null);
      setActiveTeacherId(null);
      return null;
    }

    try {
      const profile = await authService.getUserProfile(targetUid);
      if (profile && profile.isActive !== false) {
        setUserProfile(profile);
        setRole(profile.role);
        setActiveTeacherId(profile.teacherId || null);
        authService.setStoredSessionUser(profile);
        return profile;
      } else {
        setUserProfile(null);
        setRole(null);
        setActiveTeacherId(null);
        authService.setStoredSessionUser(null);
        return null;
      }
    } catch (err) {
      console.error('Failed to refresh user profile:', err);
      return null;
    }
  }, [userProfile]);

  // Initialize listener & Seed default demo accounts in background
  useEffect(() => {
    let isMounted = true;

    // Trigger non-blocking seeding of standard accounts for demo convenience
    userService.seedInitialAuthUsers().catch(() => {});

    const unsubscribe = authService.onAuthStateChanged(async (firebaseUser) => {
      if (!isMounted) return;

      if (firebaseUser) {
        setCurrentUser(firebaseUser);
        try {
          const profile = await authService.getUserProfile(firebaseUser.uid);
          if (profile) {
            if (profile.isActive === false) {
              setAuthError('Akun Anda sedang dinonaktifkan. Silakan hubungi administrator.');
              await authService.logout(profile).catch(() => {});
              if (isMounted) {
                setCurrentUser(null);
                setUserProfile(null);
                setRole(null);
                setActiveTeacherId(null);
              }
            } else {
              if (isMounted) {
                setUserProfile(profile);
                setRole(profile.role);
                setActiveTeacherId(profile.teacherId || null);
                authService.setStoredSessionUser(profile);
                setAuthError(null);
              }
            }
          } else {
            // Check fallback stored session user
            const stored = authService.getStoredSessionUser();
            if (stored && stored.isActive !== false && isMounted) {
              setUserProfile(stored);
              setRole(stored.role);
              setActiveTeacherId(stored.teacherId || null);
            }
          }
        } catch (err) {
          console.error('Error loading user profile during auth state change:', err);
          const stored = authService.getStoredSessionUser();
          if (stored && stored.isActive !== false && isMounted) {
            setUserProfile(stored);
            setRole(stored.role);
            setActiveTeacherId(stored.teacherId || null);
          }
        }
      } else {
        const stored = authService.getStoredSessionUser();
        if (stored && stored.isActive !== false) {
          if (isMounted) {
            setUserProfile(stored);
            setRole(stored.role);
            setActiveTeacherId(stored.teacherId || null);
          }
        } else {
          if (isMounted) {
            setCurrentUser(null);
            setUserProfile(null);
            setRole(null);
            setActiveTeacherId(null);
          }
        }
      }

      if (isMounted) {
        setLoading(false);
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string) => {
    setAuthError(null);
    try {
      const result = await authService.login(email, password);
      setCurrentUser(result.firebaseUser);
      setUserProfile(result.profile);
      setRole(result.profile.role);
      setActiveTeacherId(result.profile.teacherId || null);
      return result;
    } catch (err: any) {
      const friendlyMessage = authService.getErrorMessage(err);
      setAuthError(friendlyMessage);
      throw new Error(friendlyMessage);
    }
  };

  const registerAdmin = async (data: {
    displayName: string;
    email: string;
    password: string;
    phone?: string;
    institutionName?: string;
  }) => {
    setAuthError(null);
    try {
      const result = await authService.registerAdmin(data);
      setCurrentUser(result.firebaseUser);
      setUserProfile(result.profile);
      setRole('ADMIN');
      setActiveTeacherId(null);
      return result;
    } catch (err: any) {
      const friendlyMessage = authService.getErrorMessage(err);
      setAuthError(friendlyMessage);
      throw new Error(friendlyMessage);
    }
  };

  const logout = async () => {
    const profileToLogout = userProfile;
    authService.setStoredSessionUser(null);
    try {
      await authService.logout(profileToLogout);
    } catch (e) {
      console.warn('Logout error handled:', e);
    } finally {
      authService.setStoredSessionUser(null);
      setCurrentUser(null);
      setUserProfile(null);
      setRole(null);
      setActiveTeacherId(null);
      setAuthError(null);
    }
  };

  const value: AuthContextType = {
    currentUser,
    userProfile,
    role,
    activeTeacherId,
    loading,
    isAuthenticated: Boolean(userProfile && userProfile.isActive !== false),
    login,
    registerAdmin,
    logout,
    refreshUserProfile,
    authError,
    clearAuthError
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
