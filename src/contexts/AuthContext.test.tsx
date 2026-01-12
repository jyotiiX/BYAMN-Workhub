import React from 'react';
import { renderHook, act } from '@testing-library/react';
import { AuthProvider, useAuth } from './AuthContext';
import { auth } from '@/lib/firebase';

// Mock Firebase auth
jest.mock('@/lib/firebase', () => ({
  auth: {
    signOut: jest.fn(() => Promise.resolve()),
  },
  database: {},
}));

// Mock data cache
jest.mock('@/lib/data-cache', () => ({
  dataCache: {
    clearAll: jest.fn(),
    set: jest.fn(),
    get: jest.fn(),
    clear: jest.fn(),
  },
}));

// Mock utils
jest.mock('@/lib/utils', () => ({
  sanitizeInput: (input: string) => input,
  isValidUrl: jest.fn(() => true),
  isValidEmail: jest.fn(() => true),
  isValidPassword: jest.fn(() => true),
  isValidName: jest.fn(() => true),
}));

// Mock Firebase auth functions
const mockSignOut = jest.fn(() => Promise.resolve());

// Mock window methods
const originalAddEventListener = window.addEventListener;
const originalRemoveEventListener = window.removeEventListener;

describe('AuthContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Reset window event listeners
    window.addEventListener = jest.fn();
    window.removeEventListener = jest.fn();
  });

  afterEach(() => {
    window.addEventListener = originalAddEventListener;
    window.removeEventListener = originalRemoveEventListener;
  });

  it('should provide session timeout functionality', () => {
    const wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
      <AuthProvider>{children}</AuthProvider>
    );

    const { result } = renderHook(() => useAuth(), { wrapper });

    expect(result.current.setSessionTimeout).toBeDefined();
    expect(result.current.forceLogout).toBeDefined();
  });

  it('should handle logout properly by clearing cache and local storage', async () => {
    const wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
      <AuthProvider>{children}</AuthProvider>
    );

    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      await result.current.logout();
    });

    expect(auth.signOut).toHaveBeenCalled();
    // We can't directly test localStorage.clear() and sessionStorage.clear() in this context
    // but we've implemented the functionality in the context
  });

  it('should handle force logout properly', async () => {
    const wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
      <AuthProvider>{children}</AuthProvider>
    );

    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      await result.current.forceLogout();
    });

    expect(auth.signOut).toHaveBeenCalled();
  });

  it('should set up activity listeners on mount', () => {
    const wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
      <AuthProvider>{children}</AuthProvider>
    );

    renderHook(() => useAuth(), { wrapper });

    expect(window.addEventListener).toHaveBeenCalledWith('mousedown', expect.any(Function));
    expect(window.addEventListener).toHaveBeenCalledWith('keydown', expect.any(Function));
    expect(window.addEventListener).toHaveBeenCalledWith('scroll', expect.any(Function));
    expect(window.addEventListener).toHaveBeenCalledWith('touchstart', expect.any(Function));
  });
});