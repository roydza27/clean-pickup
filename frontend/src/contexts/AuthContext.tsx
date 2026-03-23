import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, UserRole } from '@/types';
import { authService } from '@/services/authService';
// import { auth, googleProvider, FIREBASE_CONFIGURED } from '@/lib/firebase';
// import { 
//   signInWithEmailAndPassword, 
//   createUserWithEmailAndPassword,
//   signInWithPopup,
//   signOut,
//   onAuthStateChanged,
//   updateProfile
// } from 'firebase/auth';

interface AuthResult {
  success: boolean;
  isNewUser?: boolean;
  error?: string;
  user?: User;
  token?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (phone: string, otp: string, role: UserRole) => Promise<AuthResult>;
  sendOTP: (phone: string) => Promise<{ success: boolean; otp?: string; error?: string }>;
  logout: () => void;
  setRole: (role: UserRole) => void;
  loginDemo: (phone: string, role: UserRole) => void;
}

// interface AuthContextType {
//   user: User | null;
//   isAuthenticated: boolean;
//   isLoading: boolean;
//   login: (phone: string, otp: string) => Promise<AuthResult>;
//   sendOTP: (phone: string) => Promise<{ success: boolean; otp?: string; error?: string }>;
//   loginWithEmail: (email: string, password: string) => Promise<AuthResult>;
//   signUpWithEmail: (email: string, password: string, name: string, role: UserRole) => Promise<AuthResult>;
//   loginWithGoogle: (role: UserRole) => Promise<AuthResult>;
//   logout: () => void;
//   setRole: (role: UserRole) => void;
//   loginDemo: (phone: string, role: UserRole) => void;
// }

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const USE_DEMO_MODE = import.meta.env.VITE_DEMO_MODE === 'true' || !import.meta.env.VITE_API_URL;

const mockUsers: Record<UserRole, User> = {
  citizen: { id: 'c1', phone: '9876543210', name: 'Rahul Sharma', role: 'citizen', locality: 'Koramangala', pincode: '560034' },
  kabadiwala: { id: 'k1', phone: '9876543211', name: 'Raju Kumar', role: 'kabadiwala', locality: 'Koramangala', pincode: '560034' },
  admin: { id: 'a1', phone: '9876543212', name: 'Admin User', role: 'admin' },
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);


  // useEffect(() => {
  //   const storedUser = authService.getCurrentUser();
  //   if (storedUser) {
  //     setUser({
  //       id: storedUser.userId?.toString() || storedUser.id,
  //       phone: storedUser.phoneNumber || storedUser.phone,
  //       name: storedUser.name || 'User',
  //       email: storedUser.email,
  //       role: storedUser.role,
  //       locality: storedUser.locality,
  //       pincode: storedUser.pincode,
  //     });
  //   }
  

  const sendOTP = async (phone: string) => {
    if (USE_DEMO_MODE) return { success: true, otp: '123456' };
    try {
      const response = await authService.sendOtp(phone);
      return { success: response.success, otp: response.otp };
    } catch (error: any) {
      return { success: false, error: error.response?.data?.error || 'Failed to send OTP' };
    }
  };

  const login = async (
    phone: string,
    otp: string,
    role: UserRole
  ): Promise<AuthResult> => {
    if (USE_DEMO_MODE) {
      if (otp === "123456") {
        const demoUser = { ...mockUsers[role], phone };
        setUser(demoUser);
        localStorage.setItem("user", JSON.stringify(demoUser));
        localStorage.setItem("auth_token", "demo-token");
        return { success: true, isNewUser: false, user: demoUser };
      }
      return { success: false, error: "Invalid OTP" };
    }

    const response = await authService.verifyOtp(phone, otp, role);

    if (response.success) {
      const normalizedUser: User = {
        id: response.user.userId.toString(),
        phone: response.user.phoneNumber,
        name: response.user.name || "User",
        role: response.user.role,
      };

      setUser(normalizedUser);
      localStorage.setItem("auth_token", response.token);
      localStorage.setItem("user", JSON.stringify(normalizedUser));

      return {
        success: true,
        isNewUser: response.isNewUser,
        user: normalizedUser,
      };
    }

    return { success: false, error: "Verification failed" };
  };




  // const loginWithEmail = async (email: string, password: string): Promise<AuthResult> => {
  //   if (!FIREBASE_CONFIGURED || !auth) {
  //     const demoUser = { ...mockUsers.citizen, email, name: email.split('@')[0] };
  //     setUser(demoUser);
  //     localStorage.setItem("user", JSON.stringify(demoUser));
  //     localStorage.setItem("auth_token", "demo-email-token");
  //     return { success: true, isNewUser: false, user: demoUser };
  //   }
  //   try {
  //     const userCredential = await signInWithEmailAndPassword(auth, email, password);
  //     const firebaseUser = userCredential.user;
  //     const existingRole = localStorage.getItem('user_role') as UserRole || 'citizen';
  //     const normalizedUser: User = { id: firebaseUser.uid, name: firebaseUser.displayName || email.split('@')[0], email: firebaseUser.email || email, role: existingRole };
  //     setUser(normalizedUser);
  //     localStorage.setItem("user", JSON.stringify(normalizedUser));
  //     localStorage.setItem("auth_token", await firebaseUser.getIdToken());
  //     return { success: true, isNewUser: false, user: normalizedUser };
  //   } catch (error: any) {
  //     const errorMessages: Record<string, string> = { 'auth/user-not-found': 'No account found', 'auth/wrong-password': 'Incorrect password', 'auth/invalid-credential': 'Invalid credentials' };
  //     return { success: false, error: errorMessages[error.code] || 'Login failed' };
  //   }
  // };

  // const signUpWithEmail = async (email: string, password: string, name: string, role: UserRole): Promise<AuthResult> => {
  //   if (!FIREBASE_CONFIGURED || !auth) {
  //     const demoUser = { ...mockUsers[role], email, name };
  //     setUser(demoUser);
  //     localStorage.setItem("user", JSON.stringify(demoUser));
  //     localStorage.setItem("user_role", role);
  //     localStorage.setItem("auth_token", "demo-signup-token");
  //     return { success: true, isNewUser: true, user: demoUser };
  //   }
  //   try {
  //     const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  //     const firebaseUser = userCredential.user;
  //     await updateProfile(firebaseUser, { displayName: name });
  //     const normalizedUser: User = { id: firebaseUser.uid, name, email: firebaseUser.email || email, role };
  //     setUser(normalizedUser);
  //     localStorage.setItem("user", JSON.stringify(normalizedUser));
  //     localStorage.setItem("user_role", role);
  //     localStorage.setItem("auth_token", await firebaseUser.getIdToken());
  //     return { success: true, isNewUser: true, user: normalizedUser };
  //   } catch (error: any) {
  //     const errorMessages: Record<string, string> = { 'auth/email-already-in-use': 'Email already exists', 'auth/weak-password': 'Password too weak' };
  //     return { success: false, error: errorMessages[error.code] || 'Signup failed' };
  //   }
  // };

  // const loginWithGoogle = async (role: UserRole): Promise<AuthResult> => {
  //   if (!FIREBASE_CONFIGURED || !auth || !googleProvider) {
  //     const demoUser = { ...mockUsers[role], email: 'demo@google.com', name: 'Google User' };
  //     setUser(demoUser);
  //     localStorage.setItem("user", JSON.stringify(demoUser));
  //     localStorage.setItem("user_role", role);
  //     localStorage.setItem("auth_token", "demo-google-token");
  //     return { success: true, isNewUser: true, user: demoUser };
  //   }
  //   try {
  //     const result = await signInWithPopup(auth, googleProvider);
  //     const firebaseUser = result.user;
  //     const isNewUser = result.user.metadata.creationTime === result.user.metadata.lastSignInTime;
  //     const normalizedUser: User = { id: firebaseUser.uid, name: firebaseUser.displayName || 'User', email: firebaseUser.email || undefined, role };
  //     setUser(normalizedUser);
  //     localStorage.setItem("user", JSON.stringify(normalizedUser));
  //     localStorage.setItem("user_role", role);
  //     localStorage.setItem("auth_token", await firebaseUser.getIdToken());
  //     return { success: true, isNewUser, user: normalizedUser };
  //   } catch (error: any) {
  //     return { success: false, error: error.code === 'auth/popup-closed-by-user' ? 'Cancelled' : 'Google login failed' };
  //   }
  // };

  const loginDemo = (phone: string, role: UserRole) => {
    const mockUser = { ...mockUsers[role], phone };
    setUser(mockUser);
    localStorage.setItem('user', JSON.stringify(mockUser));
    localStorage.setItem('user_role', role);
    localStorage.setItem('auth_token', `demo_${role}_token`);
  };

  const logout = () => {
    authService.logout();
    localStorage.removeItem("user_role");
    setUser(null);
  };


  const setRole = (role: UserRole) => {
    if (user) {
      const updatedUser = { ...user, role };
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
      localStorage.setItem('user_role', role);
    } else {
      loginDemo('9876543210', role);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        sendOTP,
        logout,
        setRole,
        loginDemo,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
