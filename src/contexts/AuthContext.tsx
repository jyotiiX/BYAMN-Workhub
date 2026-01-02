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
    const { user } = await createUserWithEmailAndPassword(auth, email, password);
    await sendEmailVerification(user);
    
    const newProfile: UserProfile = {
      uid: user.uid,
      email: email,
      fullName: fullName,
      bio: '',
      socialLinks: {},
      role: 'user',
      isBlocked: false,
      createdAt: Date.now(),
      earnedMoney: 0,
      addedMoney: 0,
      approvedWorks: 0,
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
    await signInWithEmailAndPassword(auth, email, password);
  };

  const logout = async () => {
    await signOut(auth);
    setUser(null);
    setProfile(null);
  };

  const resetPassword = async (email: string) => {
    await sendPasswordResetEmail(auth, email);
  };

  const updateProfile = async (data: Partial<UserProfile>) => {
    if (!user) return;
    await update(ref(database, `users/${user.uid}`), data);
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
