import React, { createContext, useContext, useEffect, useState } from 'react';
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
import { 
  sanitizeInput, 
  isValidUrl, 
  validateUserProfile, 
  isValidProfileImage, 
  isValidName, 
  isValidEmail,
  isValidPassword,
  validateAndSanitizeProfile
} from '@/lib/utils';

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

  const fetchProfile = async (uid: string) => {
    const snapshot = await get(child(ref(database), `users/${uid}`));
    if (snapshot.exists()) {
      setProfile(snapshot.val());
    }
    return snapshot.val();
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.uid);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      if (user) {
        await fetchProfile(user.uid);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signUp = async (email: string, password: string, fullName: string) => {
    // Validate inputs before creating user
    if (!isValidEmail(email)) {
      throw new Error('Please enter a valid email address');
    }
    
    if (!isValidPassword(password)) {
      throw new Error('Password must be at least 6 characters and contain at least one letter and one number');
    }
    
    if (!isValidName(fullName)) {
      throw new Error('Full name must contain only letters, spaces, hyphens, and apostrophes, and be between 2-50 characters');
    }

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
    
    setProfile(newProfile);
  };

  const signIn = async (email: string, password: string) => {
    // Validate inputs before signing in
    if (!isValidEmail(email)) {
      throw new Error('Please enter a valid email address');
    }
    
    if (!password || password.length < 1) {
      throw new Error('Password cannot be empty');
    }
    
    await signInWithEmailAndPassword(auth, email, password);
  };

  const logout = async () => {
    await signOut(auth);
    setUser(null);
    setProfile(null);
  };

  const resetPassword = async (email: string) => {
    if (!isValidEmail(email)) {
      throw new Error('Please enter a valid email address');
    }
    
    await sendPasswordResetEmail(auth, email);
  };

  const updateProfile = async (data: Partial<UserProfile>) => {
    if (!user) return;
    
    // Validate and sanitize the profile data
    const validation = validateAndSanitizeProfile(data);
    if (!validation.isValid) {
      throw new Error(validation.errors.join(', '));
    }
    
    const sanitizedData = validation.sanitizedData;
    
    await update(ref(database, `users/${user.uid}`), sanitizedData);
    await fetchProfile(user.uid);
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
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};