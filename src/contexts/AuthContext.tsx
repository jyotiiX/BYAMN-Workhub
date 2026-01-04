import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { 
  User, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  sendPasswordResetEmail,
  sendEmailVerification,
  onAuthStateChanged
} from 'firebase/auth';
import { ref, set, get, child, update } from 'firebase/database';
import { auth, database } from '@/lib/firebase';
import { sanitizeInput, isValidUrl, isValidEmail, isValidPassword, isValidName } from '@/lib/utils';
import { dataCache } from '@/lib/data-cache';

interface UserProfile {
  uid: string;
  email: string;
  fullName: string;
  bio: string;
  socialLinks: {
    linkedin?: string;
    twitter?: string;
    instagram?: string;
    youtube?: string;
    other?: string;
  };
  profileImage?: string;
  role: 'user' | 'admin';
  isBlocked: boolean;
  createdAt: number;
  earnedMoney: number;
  addedMoney: number;
  approvedWorks: number;
  totalWithdrawn: number;
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  signUp: (email: string, password: string, fullName: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateProfile: (data: Partial<UserProfile>) => Promise<void>;
  refreshProfile: () => Promise<void>;
  // Session management
  setSessionTimeout: (timeoutMs: number) => void;
  forceLogout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Session timeout configuration
  const [sessionTimeout, setSessionTimeout] = useState<number>(30 * 60 * 1000); // 30 minutes default
  const [lastActivity, setLastActivity] = useState<number>(Date.now());
  const sessionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Function to reset session timeout
  const resetSessionTimeout = () => {
    setLastActivity(Date.now());
    
    // Clear existing timeout if any
    if (sessionTimeoutRef.current) {
      clearTimeout(sessionTimeoutRef.current);
    }
    
    // Set new timeout
    sessionTimeoutRef.current = setTimeout(() => {
      // Auto logout when session expires
      handleSessionTimeout();
    }, sessionTimeout);
  };
  
  // Function to handle session timeout
  const handleSessionTimeout = async () => {
    console.log('Session timed out due to inactivity');
    await forceLogout();
  };
  
  // Function to force logout (used for session timeout)
  const forceLogout = async () => {
    if (sessionTimeoutRef.current) {
      clearTimeout(sessionTimeoutRef.current);
    }
    
    // Clear Firebase auth state
    await signOut(auth);
    
    // Clear local state
    setUser(null);
    setProfile(null);
    
    // Clear all cached data
    dataCache.clearAll();
    
    // Clear any stored session data
    localStorage.clear();
    sessionStorage.clear();
  };

  const fetchProfile = async (uid: string): Promise<UserProfile | null> => {
    try {
      const profileData = await fetchUserData(uid);
      if (profileData) {
        // Validate the fetched profile data
        if (validateUserProfile(profileData).isValid) {
          setProfile(profileData);
          return profileData;
        } else {
          console.error('Invalid profile data received:', validateUserProfile(profileData).errors);
          return null;
        }
      }
      return null;
    } catch (error: any) {
      console.error('Error fetching profile:', error);
      // Optionally set an error state here
      return null;
    }
    return snapshot.val();
  };

  const refreshProfile = async (): Promise<void> => {
    if (user) {
      await fetchProfile(user.uid);
    }
  };

  useEffect(() => {
    // Set up event listeners for user activity
    const handleUserActivity = () => {
      resetSessionTimeout();
    };
    
    // Add event listeners for user activity
    window.addEventListener('mousedown', handleUserActivity);
    window.addEventListener('keydown', handleUserActivity);
    window.addEventListener('scroll', handleUserActivity);
    window.addEventListener('touchstart', handleUserActivity);
    
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      try {
        setUser(user);
        if (user) {
          await fetchProfile(user.uid);
        } else {
          setProfile(null);
        }
      } catch (error) {
        console.error('Error in auth state change:', error);
        setProfile(null);
      } finally {
        setLoading(false);
      }
    });

    // Clean up event listeners and timeout
    return () => {
      unsubscribe();
      window.removeEventListener('mousedown', handleUserActivity);
      window.removeEventListener('keydown', handleUserActivity);
      window.removeEventListener('scroll', handleUserActivity);
      window.removeEventListener('touchstart', handleUserActivity);
      if (sessionTimeoutRef.current) {
        clearTimeout(sessionTimeoutRef.current);
      }
    };
  }, []);

  const signUp = async (email: string, password: string, fullName: string): Promise<void> => {
    // Validate inputs before creating user
    if (!isValidEmail(email)) {
      throw new Error('Please enter a valid email address');
    }
    
    if (!isValidPassword(password)) {
      throw new Error('Password must be at least 8 characters and contain at least one uppercase, one lowercase, one number and one special character');
    }
    
    if (!isValidName(fullName)) {
      throw new Error('Full name must contain only letters, spaces, hyphens, and apostrophes, and be between 2-50 characters');
    }
    
    // Additional security: Check for duplicate emails
    const usersSnap = await get(ref(database, 'users'));
    if (usersSnap.exists()) {
      const users = usersSnap.val();
      for (const [uid, userData] of Object.entries(users)) {
        if ((userData as UserProfile).email === email) {
          throw new Error('A user with this email already exists');
        }
      }
    }

    try {
      const { user } = await createUserWithEmailAndPassword(auth, email, password);
      await sendEmailVerification(user);
      
      const newProfile: UserProfile = {
        uid: user.uid,
        email: email,
        fullName: sanitizeInput(fullName),
        bio: '',
        socialLinks: {},
        role: 'user',
        isBlocked: false,
        createdAt: Date.now(),
        earnedMoney: 0,
        addedMoney: 0,
        approvedWorks: 0,
        totalWithdrawn: 0,
      };
      
      await set(ref(database, `users/${user.uid}`), newProfile);
      
      // Initialize wallet
      await set(ref(database, `wallets/${user.uid}`), {
        earnedBalance: 0,
        addedBalance: 0,
        pendingAddMoney: 0,
        totalWithdrawn: 0,
      });
      
      // Set profile in cache
      dataCache.set(`user:${user.uid}`, newProfile);
      
      setProfile(newProfile);
    } catch (error: any) {
      console.error('Error during sign up:', error);
      // Clean up in case of error
      if (error.code === 'auth/email-already-in-use') {
        throw new Error('Email already in use. Please use a different email address.');
      } else {
        throw new Error('Failed to create account. Please try again later.');
      }
    }
  };

  const signIn = async (email: string, password: string): Promise<void> => {
    // Validate inputs before signing in
    if (!isValidEmail(email)) {
      throw new Error('Please enter a valid email address');
    }
    
    if (!password || password.length < 1) {
      throw new Error('Password cannot be empty');
    }
    
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error: any) {
      console.error('Error during sign in:', error);
      if (error.code === 'auth/user-not-found') {
        throw new Error('No account found with this email. Please check your email or sign up for a new account.');
      } else if (error.code === 'auth/wrong-password') {
        throw new Error('Incorrect password. Please try again.');
      } else if (error.code === 'auth/too-many-requests') {
        throw new Error('Too many failed login attempts. Please try again later.');
      } else {
        throw new Error('Failed to sign in. Please check your credentials and try again.');
      }
    }
  };

  const logout = async (): Promise<void> => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Error during logout:', error);
    } finally {
      setUser(null);
      setProfile(null);
      
      // Clear user cache
      if (user) {
        clearUserCache(user.uid);
      }
    }
  };

  const resetPassword = async (email: string): Promise<void> => {
    if (!isValidEmail(email)) {
      throw new Error('Please enter a valid email address');
    }
    
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error: any) {
      console.error('Error during password reset:', error);
      if (error.code === 'auth/user-not-found') {
        throw new Error('No account found with this email address.');
      } else {
        throw new Error('Failed to send password reset email. Please try again later.');
      }
    }
  };

  const updateProfile = async (data: Partial<UserProfile>): Promise<void> => {
    if (!user) {
      throw new Error('User not authenticated');
    }
    
    // Sanitize profile data to prevent XSS and injection attacks
    const sanitizedData: Partial<UserProfile> = {};
    
    if (data.fullName) {
      sanitizedData.fullName = sanitizeInput(data.fullName);
      // Additional validation for name
      if (!isValidName(data.fullName)) {
        throw new Error('Full name must contain only letters, spaces, hyphens, and apostrophes, and be between 2-50 characters');
      }
    }
    
    if (data.bio) {
      sanitizedData.bio = sanitizeInput(data.bio);
      // Additional validation for bio
      if (data.bio.length > 500) {
        throw new Error('Bio must be less than 500 characters');
      }
    }
    
    try {
      await update(ref(database, `users/${user.uid}`), sanitizedData);
      
      // Invalidate and update cache
      invalidateUserCache(user.uid);
      await fetchProfile(user.uid);
    } catch (error) {
      console.error('Error updating profile:', error);
      throw new Error('Failed to update profile. Please try again later.');
    }
  };

  const value = {
    user,
    profile,
    loading,
    signUp,
    signIn,
    logout,
    resetPassword,
    updateProfile,
    refreshProfile,
    // Session management functions
    setSessionTimeout,
    forceLogout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
